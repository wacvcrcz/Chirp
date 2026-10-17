import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Mirror of the hand-written SQL in drizzle/. Migrations there are the source
 * of truth for extensions, triggers and RLS; this file is for typed queries.
 */

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const mediaKind = pgEnum("media_kind", ["image", "video"]);
export const mediaStatus = pgEnum("media_status", [
  "pending",
  "ready",
  "rejected",
]);
export const notifType = pgEnum("notif_type", ["like", "reply", "follow"]);
export const reportStatus = pgEnum("report_status", [
  "open",
  "dismissed",
  "actioned",
]);
export const reportTarget = pgEnum("report_target", ["chirp", "user"]);

const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

/**
 * Supabase's auth schema is not managed by these migrations, but profiles.id
 * references it. Drizzle needs the table object to type the foreign key, so
 * this is a read-only descriptor of auth.users, not a migration target.
 */
export const authUsers = pgTable("users", {
  id: uuid("id").primaryKey(),
});

// citext has no native Drizzle column type; text keeps the name and the
// database keeps the case-insensitive semantics.
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    username: text("username").unique(),
    displayName: text("display_name"),
    bio: text("bio"),
    avatarPath: text("avatar_path"),
    role: userRole("role").notNull().default("user"),
    maxChars: integer("max_chars").notNull().default(280),
    preferredLangs: text("preferred_langs").array().notNull().default(["en"]),
    followerCount: integer("follower_count").notNull().default(0),
    followingCount: integer("following_count").notNull().default(0),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    check("username", sql`${t.username} ~ '^[a-z0-9_]{3,20}$'`),
  ],
);

export const chirps = pgTable(
  "chirps",
  {
    id: uuid("id").primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    bodySearch: text("body_search").notNull().default(""),
    lang: text("lang"),
    replyToId: uuid("reply_to_id"),
    rootId: uuid("root_id"),
    likeCount: integer("like_count").notNull().default(0),
    replyCount: integer("reply_count").notNull().default(0),
    createdAt,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    check("body_length", sql`char_length(${t.body}) <= 2000`),
  ],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    chirpId: uuid("chirp_id").references(() => chirps.id, {
      onDelete: "cascade",
    }),
    kind: mediaKind("kind").notNull(),
    storagePath: text("storage_path").notNull(),
    mime: text("mime").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    placeholder: text("placeholder"),
    status: mediaStatus("status").notNull().default("pending"),
    position: smallint("position").notNull().default(0),
    createdAt,
  },
  (t) => [
    index("media_chirp").on(t.chirpId),
    index("media_orphans").on(t.createdAt).where(sql`${t.chirpId} is null`),
  ],
);

export const follows = pgTable(
  "follows",
  {
    followerId: uuid("follower_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    followeeId: uuid("followee_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followeeId] }),
    check("no_self_follow", sql`${t.followerId} <> ${t.followeeId}`),
    index("follows_followee").on(t.followeeId),
  ],
);

export const likes = pgTable(
  "likes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    chirpId: uuid("chirp_id")
      .notNull()
      .references(() => chirps.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.chirpId] }),
    index("likes_chirp").on(t.chirpId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: notifType("type").notNull(),
    chirpId: uuid("chirp_id").references(() => chirps.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [index("notifs_user_time").on(t.userId, t.createdAt.desc())],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    targetType: reportTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    status: reportStatus("status").notNull().default("open"),
    resolvedBy: uuid("resolved_by").references(() => profiles.id),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt,
  },
  (t) => [
    check("reason_length", sql`char_length(${t.reason}) <= 500`),
    index("reports_open").on(t.createdAt).where(sql`${t.status} = 'open'`),
  ],
);

export const moderationActions = pgTable("moderation_actions", {
  id: uuid("id").primaryKey(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => profiles.id),
  action: text("action").notNull(),
  targetType: reportTarget("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  reportId: uuid("report_id").references(() => reports.id),
  note: text("note"),
  createdAt,
});

export const impressions = pgTable(
  "impressions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    chirpId: uuid("chirp_id")
      .notNull()
      .references(() => chirps.id, { onDelete: "cascade" }),
    surface: text("surface").notNull(),
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
    dwellMs: integer("dwell_ms"),
  },
  (t) => [index("impressions_user").on(t.userId, t.seenAt.desc())],
);

export const topics = pgTable("topics", {
  slug: text("slug").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
});

export const userTopics = pgTable(
  "user_topics",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    topicSlug: text("topic_slug")
      .notNull()
      .references(() => topics.slug, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.topicSlug] })],
);

export const suggestedAccounts = pgTable(
  "suggested_accounts",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    topicSlug: text("topic_slug")
      .notNull()
      .references(() => topics.slug, { onDelete: "cascade" }),
    rank: integer("rank").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.profileId, t.topicSlug] })],
);

