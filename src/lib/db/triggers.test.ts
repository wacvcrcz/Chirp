import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { uuidv7 } from "uuidv7";
import {
  createUser,
  hasTestDatabase,
  resetData,
  testClient,
} from "@/lib/db/test-helpers";

const sql = hasTestDatabase ? testClient() : null;

describe.skipIf(!hasTestDatabase)("counter triggers", () => {
  beforeAll(async () => {
    if (!sql) return;
    // The schema must exist; pnpm db:test-setup applies the migrations.
    const [{ exists }] = await sql`
      select exists (
        select 1 from information_schema.tables where table_name = 'chirps'
      ) as exists
    `;
    if (!exists) {
      throw new Error(
        "chirps table missing. Run pnpm db:test-setup before the trigger tests.",
      );
    }
  });

  afterAll(async () => {
    await sql?.end();
  });

  beforeEach(async () => {
    if (sql) await resetData(sql);
  });

  it("counts likes up on insert and down on delete", async () => {
    if (!sql) return;
    const author = uuidv7();
    const liker = uuidv7();
    await createUser(sql, author, "author_one");
    await createUser(sql, liker, "liker_one");

    const chirp = uuidv7();
    await sql`insert into chirps (id, author_id, body) values (${chirp}, ${author}, ${"hello"})`;

    await sql`insert into likes (user_id, chirp_id) values (${liker}, ${chirp})`;
    let [row] = await sql`select like_count from chirps where id = ${chirp}`;
    expect(row.like_count).toBe(1);

    // A second liker increments again; a duplicate like is rejected by the
    // primary key and must not touch the counter.
    const second = uuidv7();
    await createUser(sql, second, "liker_one_b");
    await sql`insert into likes (user_id, chirp_id) values (${second}, ${chirp})`;
    [row] = await sql`select like_count from chirps where id = ${chirp}`;
    expect(row.like_count).toBe(2);

    await expect(
      sql`insert into likes (user_id, chirp_id) values (${second}, ${chirp})`,
    ).rejects.toThrow();
    [row] = await sql`select like_count from chirps where id = ${chirp}`;
    expect(row.like_count).toBe(2);

    await sql`delete from likes where chirp_id = ${chirp}`;
    [row] = await sql`select like_count from chirps where id = ${chirp}`;
    expect(row.like_count).toBe(0);
  });

  it("never lets a like count go below zero", async () => {
    if (!sql) return;
    const author = uuidv7();
    const liker = uuidv7();
    await createUser(sql, author, "author_two");
    await createUser(sql, liker, "liker_two");
    const chirp = uuidv7();
    await sql`insert into chirps (id, author_id, body) values (${chirp}, ${author}, ${"hello"})`;

    await sql`update chirps set like_count = 0 where id = ${chirp}`;
    await sql`insert into likes (user_id, chirp_id) values (${liker}, ${chirp})`;
    await sql`delete from likes where user_id = ${liker}`;
    const [row] = await sql`select like_count from chirps where id = ${chirp}`;
    expect(row.like_count).toBe(0);
  });

  it("counts replies on insert and delete without double counting", async () => {
    if (!sql) return;
    const author = uuidv7();
    await createUser(sql, author, "author_three");
    const parent = uuidv7();
    await sql`insert into chirps (id, author_id, body) values (${parent}, ${author}, ${"parent"})`;

    const replyA = uuidv7();
    const replyB = uuidv7();
    await sql`
      insert into chirps (id, author_id, body, reply_to_id, root_id)
      values (${replyA}, ${author}, ${"first reply"}, ${parent}, ${parent})
    `;
    await sql`
      insert into chirps (id, author_id, body, reply_to_id, root_id)
      values (${replyB}, ${author}, ${"second reply"}, ${parent}, ${parent})
    `;

    let [row] = await sql`select reply_count from chirps where id = ${parent}`;
    expect(row.reply_count).toBe(2);

    await sql`delete from chirps where id = ${replyA}`;
    [row] = await sql`select reply_count from chirps where id = ${parent}`;
    expect(row.reply_count).toBe(1);

    await sql`delete from chirps where id = ${replyB}`;
    [row] = await sql`select reply_count from chirps where id = ${parent}`;
    expect(row.reply_count).toBe(0);
  });

  it("does not count root chirps as replies", async () => {
    if (!sql) return;
    const author = uuidv7();
    await createUser(sql, author, "author_four");
    await sql`insert into chirps (id, author_id, body) values (${uuidv7()}, ${author}, ${"root"})`;
    const [row] = await sql`select count(*)::int as n from chirps where reply_count <> 0`;
    expect(row.n).toBe(0);
  });

  it("keeps follower and following counts in step", async () => {
    if (!sql) return;
    const a = uuidv7();
    const b = uuidv7();
    await createUser(sql, a, "follower_a");
    await createUser(sql, b, "follower_b");

    type Counts = { id: string; follower_count: number; following_count: number };

    await sql`insert into follows (follower_id, followee_id) values (${a}, ${b})`;
    let rows = (await sql`
      select id, follower_count, following_count from profiles
      where id in (${a}, ${b}) order by id
    `) as unknown as Counts[];
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId[a].following_count).toBe(1);
    expect(byId[a].follower_count).toBe(0);
    expect(byId[b].follower_count).toBe(1);
    expect(byId[b].following_count).toBe(0);

    await sql`delete from follows where follower_id = ${a} and followee_id = ${b}`;
    rows = (await sql`
      select id, follower_count, following_count from profiles
      where id in (${a}, ${b}) order by id
    `) as unknown as Counts[];
    const after = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(after[a].following_count).toBe(0);
    expect(after[b].follower_count).toBe(0);
  });

  it("keeps counts consistent when a chirp cascades away", async () => {
    if (!sql) return;
    const author = uuidv7();
    const liker = uuidv7();
    await createUser(sql, author, "author_five");
    await createUser(sql, liker, "liker_five");

    const chirp = uuidv7();
    await sql`insert into chirps (id, author_id, body) values (${chirp}, ${author}, ${"doomed"})`;
    await sql`insert into likes (user_id, chirp_id) values (${liker}, ${chirp})`;

    await sql`delete from chirps where id = ${chirp}`;
    const [{ count }] = await sql`select count(*)::int as count from likes`;
    expect(count).toBe(0);
  });

  it("creates a profile for every auth user", async () => {
    if (!sql) return;
    const id = uuidv7();
    await sql`insert into auth.users (id, email) values (${id}, ${"triggered@example.test"})`;
    const rows = await sql`select id from profiles where id = ${id}`;
    expect(rows).toHaveLength(1);
  });
});
