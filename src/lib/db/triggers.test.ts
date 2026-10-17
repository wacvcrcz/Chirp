import { describe, expect, it } from "vitest";
import { uuidv7 } from "uuidv7";
import {
  createTestUser,
  deleteTestUser,
  hasDatabase,
  testSql,
  type TestUser,
} from "@/lib/db/test-helpers";

const sql = hasDatabase ? testSql() : null;

describe.skipIf(!hasDatabase)("counter triggers", () => {
  it("counts likes up on insert and down on delete", async () => {
    if (!sql) return;
    let author: TestUser | undefined;
    let liker: TestUser | undefined;
    let second: TestUser | undefined;
    try {
      author = await createTestUser(sql);
      liker = await createTestUser(sql);
      second = await createTestUser(sql);

      const chirp = uuidv7();
      await sql`insert into chirps (id, author_id, body) values (${chirp}, ${author.id}, ${"like test"})`;

      await sql`insert into likes (user_id, chirp_id) values (${liker.id}, ${chirp})`;
      let [row] = await sql`select like_count from chirps where id = ${chirp}`;
      expect(row.like_count).toBe(1);

      await sql`insert into likes (user_id, chirp_id) values (${second.id}, ${chirp})`;
      [row] = await sql`select like_count from chirps where id = ${chirp}`;
      expect(row.like_count).toBe(2);

      // The primary key rejects a duplicate like and leaves the counter alone.
      await expect(
        sql`insert into likes (user_id, chirp_id) values (${second.id}, ${chirp})`,
      ).rejects.toThrow();
      [row] = await sql`select like_count from chirps where id = ${chirp}`;
      expect(row.like_count).toBe(2);

      await sql`delete from likes where chirp_id = ${chirp}`;
      [row] = await sql`select like_count from chirps where id = ${chirp}`;
      expect(row.like_count).toBe(0);
    } finally {
      await deleteTestUser(second);
      await deleteTestUser(liker);
      await deleteTestUser(author);
    }
  });

  it("never lets a like count go below zero", async () => {
    if (!sql) return;
    let author: TestUser | undefined;
    let liker: TestUser | undefined;
    try {
      author = await createTestUser(sql);
      liker = await createTestUser(sql);
      const chirp = uuidv7();
      await sql`insert into chirps (id, author_id, body) values (${chirp}, ${author.id}, ${"floor test"})`;

      await sql`insert into likes (user_id, chirp_id) values (${liker.id}, ${chirp})`;
      await sql`delete from likes where user_id = ${liker.id}`;
      const [row] = await sql`select like_count from chirps where id = ${chirp}`;
      expect(row.like_count).toBe(0);
    } finally {
      await deleteTestUser(liker);
      await deleteTestUser(author);
    }
  });

  it("counts replies on insert and delete without double counting", async () => {
    if (!sql) return;
    let author: TestUser | undefined;
    try {
      author = await createTestUser(sql);
      const parent = uuidv7();
      await sql`insert into chirps (id, author_id, body) values (${parent}, ${author.id}, ${"parent"})`;

      const replyA = uuidv7();
      const replyB = uuidv7();
      await sql`
        insert into chirps (id, author_id, body, reply_to_id, root_id)
        values (${replyA}, ${author.id}, ${"first reply"}, ${parent}, ${parent})
      `;
      await sql`
        insert into chirps (id, author_id, body, reply_to_id, root_id)
        values (${replyB}, ${author.id}, ${"second reply"}, ${parent}, ${parent})
      `;

      let [row] = await sql`select reply_count from chirps where id = ${parent}`;
      expect(row.reply_count).toBe(2);

      await sql`delete from chirps where id = ${replyA}`;
      [row] = await sql`select reply_count from chirps where id = ${parent}`;
      expect(row.reply_count).toBe(1);

      await sql`delete from chirps where id = ${replyB}`;
      [row] = await sql`select reply_count from chirps where id = ${parent}`;
      expect(row.reply_count).toBe(0);
    } finally {
      await deleteTestUser(author);
    }
  });

  it("does not count root chirps as replies", async () => {
    if (!sql) return;
    let author: TestUser | undefined;
    try {
      author = await createTestUser(sql);
      await sql`insert into chirps (id, author_id, body) values (${uuidv7()}, ${author.id}, ${"root"})`;
      const [row] = await sql`
        select count(*)::int as n from chirps
        where author_id = ${author.id} and reply_count <> 0
      `;
      expect(row.n).toBe(0);
    } finally {
      await deleteTestUser(author);
    }
  });

  it("keeps follower and following counts in step", async () => {
    if (!sql) return;
    let a: TestUser | undefined;
    let b: TestUser | undefined;
    try {
      a = await createTestUser(sql);
      b = await createTestUser(sql);

      await sql`insert into follows (follower_id, followee_id) values (${a.id}, ${b.id})`;
      type Counts = { id: string; follower_count: number; following_count: number };
      let rows = (await sql`
        select id, follower_count, following_count from profiles
        where id in (${a.id}, ${b.id}) order by id
      `) as unknown as Counts[];
      let byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      expect(byId[a.id].following_count).toBe(1);
      expect(byId[a.id].follower_count).toBe(0);
      expect(byId[b.id].follower_count).toBe(1);
      expect(byId[b.id].following_count).toBe(0);

      await sql`delete from follows where follower_id = ${a.id} and followee_id = ${b.id}`;
      rows = (await sql`
        select id, follower_count, following_count from profiles
        where id in (${a.id}, ${b.id}) order by id
      `) as unknown as Counts[];
      byId = Object.fromEntries(rows.map((r) => [r.id, r]));
      expect(byId[a.id].following_count).toBe(0);
      expect(byId[b.id].follower_count).toBe(0);
    } finally {
      await deleteTestUser(b);
      await deleteTestUser(a);
    }
  });

  it("keeps counts consistent when a chirp cascades away", async () => {
    if (!sql) return;
    let author: TestUser | undefined;
    let liker: TestUser | undefined;
    try {
      author = await createTestUser(sql);
      liker = await createTestUser(sql);

      const chirp = uuidv7();
      await sql`insert into chirps (id, author_id, body) values (${chirp}, ${author.id}, ${"doomed"})`;
      await sql`insert into likes (user_id, chirp_id) values (${liker.id}, ${chirp})`;

      await sql`delete from chirps where id = ${chirp}`;
      const [{ count }] = await sql`
        select count(*)::int as count from likes where user_id = ${liker.id}
      `;
      expect(count).toBe(0);
    } finally {
      await deleteTestUser(liker);
      await deleteTestUser(author);
    }
  });

  it("creates a profile through the admin API", async () => {
    if (!sql) return;
    let user: TestUser | undefined;
    try {
      user = await createTestUser(sql);
      const rows = await sql`select id from profiles where id = ${user.id}`;
      expect(rows).toHaveLength(1);
    } finally {
      await deleteTestUser(user);
    }
  });
});
