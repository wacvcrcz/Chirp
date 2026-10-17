import postgres from "postgres";
import { uuidv7 } from "uuidv7";
import { detectLang, normalizeForSearch } from "../src/lib/text/normalize";
import { isLocalDatabaseUrl } from "../src/lib/db/url";

/**
 * Refuses anything that is not clearly local. The guard is deliberately
 * strict: a typo in DATABASE_URL must never touch a real project.
 */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Copy it from your Supabase project settings.");
  process.exit(1);
}

if (process.env.ALLOW_REMOTE_SEED !== "true" && !isLocalDatabaseUrl(url)) {
  console.error(
    `Refusing to seed ${new URL(url).hostname || "(unparseable URL)"}. ` +
      `Seeding only runs against local Postgres (localhost, 127.0.0.1, ::1). ` +
      `For a throwaway hosted dev database, set ALLOW_REMOTE_SEED=true deliberately.`,
  );
  process.exit(1);
}

/** UUIDv7 whose 48-bit timestamp is the given ms, so ids sort by time. */
function idAt(msecs: number): string {
  const id = uuidv7();
  const stamp = msecs.toString(16).padStart(12, "0");
  return `${stamp.slice(0, 8)}-${stamp.slice(8, 12)}-${id.slice(14)}`;
}

function rand<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function sample<T>(items: readonly T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const NAMES = [
  ["Maya Chen", "mayachen", "en"],
  ["يوسف العامري", "youssef", "ar"],
  ["Nadia Haddad", "nadia_h", "ar"],
  ["Omar Benali", "omarb", "ar"],
  ["Sara El Idrissi", "sara_el", "ar"],
  ["Tomás Rivera", "tomasr", "en"],
  ["Amina Toure", "aminat", "fr"],
  ["Khalid Mansour", "khalidm", "ar"],
  ["Leila Farsi", "leilaf", "ar"],
  ["Daniel Okafor", "danokafor", "en"],
  ["حسام الدين", "houssam", "ar"],
  ["Zineb Cherkaoui", "zineb", "ar"],
  ["Pierre Dubois", "pierred", "fr"],
  ["Fatima Zahra", "fatimaz", "ar"],
  ["Ali Rahmani", "alir", "ar"],
  ["Elena Petrova", "elenap", "en"],
  ["Mehdi Alaoui", "mehdia", "ar"],
  ["Aya Takahashi", "ayat", "en"],
  ["Rachid Bouzid", "rachidb", "ar"],
  ["Lina Khalil", "linak", "ar"],
  ["Samuel Adeyemi", "samuela", "en"],
  ["هند العلي", "hind", "ar"],
  ["Karim Bensalah", "karimb", "ar"],
  ["Chloé Martin", "chloem", "fr"],
  ["Ibrahim Saleh", "ibrahims", "ar"],
  ["Nora Lindqvist", "noral", "en"],
  ["ياسين الطاهري", "yassine", "ar"],
  ["Mariam Diop", "mariamd", "fr"],
  ["Hugo Laurent", "hugol", "fr"],
  ["Salma Idrissi", "salma_id", "ar"],
  ["Adam Cohen", "adamc", "en"],
  ["خديجة بنعمر", "khadija", "ar"],
  ["Bilal Hussain", "bilalh", "en"],
  ["Ines Ben Amor", "inesb", "ar"],
  ["Victor Nguyen", "victorn", "en"],
  ["زين العابدين", "zine_abidine", "ar"],
  ["Hafsa Ouahabi", "hafsao", "ar"],
  ["Leo Fischer", "leof", "en"],
  ["Meriem Saidi", "meriems", "ar"],
  ["Abdelkader Belaid", "abdelkader", "ar"],
  ["Priya Sharma", "priyas", "en"],
  ["فاطمة الزهراء", "fatima_z", "ar"],
  ["Jonas Weber", "jonasw", "en"],
  ["Hamza Berrada", "hamzab", "ar"],
  ["Sofia Rossi", "sofiar", "en"],
  ["نور الهدى", "nour", "ar"],
  ["Anas Fikri", "anasf", "ar"],
  ["Grace Kimani", "gracek", "en"],
  ["طارق الجبلي", "tarikj", "ar"],
  ["Emma Johansson", "emmaj", "en"],
] as const;

const CHIRPS_AR = [
  "بديت نتعلم البرمجة من الصفر، وأول تطبيق ديالي قريب يخرج للناس.",
  "الجو اليوم في الدار البيضاء رطب بزاف، خاصنا قهوة قوية.",
  "أحسن حاجة في الأسبوع: نلقى وقت نقرأ كتاب بلا تلفون.",
  "المنتخب لعب مباراة كبيرة، حتى لو النتيجة ما كانتش في صالحنا.",
  "واش كاين شي حد هنا كيلعب الشطرنج؟ بغيت نلقى خصم قوي.",
  "المدرسة دارت معرض للمشاريع، والتفنن كان باين في كل بلاصة.",
  "تعلمت حاجة اليوم: إلا ما كتبتهاش، ما غادي نتذكرها.",
  "الصبر مفتاح الفرج، ولكن التخطيط هو اللي كيسد الباب.",
  "القهوة الصباحية عندها طعم مختلف فالعطلة.",
  "بغيت نبدل روتيني، نصحوني بكتب صغيرة نقراها قبل النعاس.",
  "الأصدقاء القدامى هم اللي كيفهموك منين نسيت روحك.",
  "كتبت اليوم أول مسودة لفصل جديد من الرواية.",
  "الطيارة تأخرت ساعتين، ولكن اللقاء كان يستاهل.",
  "في المغرب، الأكل ما هو غير أكل، هو مناسبة.",
  "سؤال للجميع: شنو أفضل طريقة لتوفير الوقت فالصباح؟",
  "الرياضة ثلاثة أيام فالأسبوع بدلات مزاجي بشكل واضح.",
  "قررت نتعلم الفوتوغرافيا، الكاميرا القديمة ديال والدي غادي ترجع للخدمة.",
  "الليل في الصحرا فيه نجوم ما شفتهمش فحياتي.",
  "كل مشروع كبير بدا بفكرة صغيرة محرجة.",
  "خدمت على تصميم جديد، الهدف ديالي: بساطة بلا ملل.",
  "الحلاقة زادت الثمن، ولكن النتيجة نضيفة.",
  "اليوم جربت نكتب بالعربية على الكيبورد بلا تشكيل، والنتيجة مرضية.",
  "الجيران دارو وليمة، وشاركنا فيها كاملين.",
  "ما بقاش لي غير شهر باش نكمل المشروع، والوقت كيجري.",
  "قرأت مقال على التصميم، وحسيت أني كنت كنعاود نفس الأخطاء.",
  "بغيت نعرف: شحال من واحد هنا كيخدم عن بعد؟",
  "المدينة القديمة فيها حياة ما تلقاهاش فالمراكز التجارية.",
  "الداريجة مكتوبة بالحروف اللاتينية عندها سحر خاص.",
  "الويفي قطع فمقتل، وخلاني نرجع للكتب.",
  "غدا غادي نمشي للمكتبة ونشري شي حاجة بلا ما نخطط.",
] as const;

const CHIRPS_EN = [
  "The feed column stays quiet: dividers, no cards, no noise.",
  "Shipped the smallest possible version and learned more in a day than in a month of planning.",
  "What is one small habit that changed your week?",
  "Reading about RTL typography made me rethink every margin I have ever set.",
  "A good error message says what happened and how to fix it. Nothing else.",
  "Coffee, a notebook, and an empty morning. That is the whole plan.",
  "I keep a list of sentences I want to steal from books. This one is from today.",
  "The city at 6am belongs to people walking dogs and bakers.",
  "Three years of notes compressed into one page. Still too long.",
  "If you are learning Arabic, start with songs. The rhythm teaches the letters.",
  "We replaced a dashboard with one sentence and nobody asked for the dashboard again.",
  "Small teams win by saying no politely and often.",
  "The best code review comment I ever got: this works, now delete half of it.",
  "Rain on the roof makes every task feel optional.",
  "Trying to write shorter. This sentence is a failure.",
  "Found an old notebook with a plan I forgot I made. Half of it happened anyway.",
  "Do you keep a reading log? I stopped and missed the pattern.",
  "Design is done when removing anything else would break it.",
  "Today I learned that grapheme clusters are not characters and characters are not bytes.",
  "A short walk fixes more bugs than a long meeting.",
  "The new font makes Arabic and Latin feel like one voice.",
  "Shipping on a Friday is either brave or reckless. Today it felt brave.",
  "I want a search box that forgives my spelling.",
  "People underestimate how much clarity comes from consistent names.",
  "The quietest interface I used this week was also the easiest.",
  "Laundry, then a long train ride, then a chapter.",
  "My first pull request had 41 comments. I still think about two of them.",
  "Good documentation is a gift to the person you will be in six months.",
  "The market had figs and the baker remembered my name.",
  "A timeline is just a promise that time moves in one direction.",
] as const;

const CHIRPS_FR = [
  "Le marché de dimanche matin sent le pain et les épices.",
  "J'apprends l'arabe avec des chansons. Le rythme aide pour les lettres.",
  "La ville est calme avant huit heures, puis elle change de visage.",
  "Une bonne erreur dit ce qui s'est passé et comment la corriger.",
  "Le café du coin a une nouvelle machine et la même conversation.",
] as const;

const MIXED_AR = ["بديت بالعربية", "ثم switched to English", "والاتجاه بقى صحيح"];
const MIXED_EN = ["shipped today", "the shell mirrors", "and the digits stay 123"];

function chirpBody(index: number): string {
  const bucket = index % 10;
  if (bucket < 5) return rand(CHIRPS_AR);
  if (bucket < 8) return rand(CHIRPS_EN);
  if (bucket < 9) return rand(CHIRPS_FR);
  return `${rand(MIXED_AR)} ${rand(MIXED_EN)} ${rand(MIXED_AR)}`;
}

const TOPICS = [
  ["football", "Football", "كرة القدم"],
  ["dev", "Development", "البرمجة"],
  ["design", "Design", "التصميم"],
  ["books", "Books", "الكتب"],
  ["food", "Food", "الطبخ"],
  ["music", "Music", "الموسيقى"],
  ["travel", "Travel", "السفر"],
  ["darija", "Darija", "الداريجة"],
] as const;

const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });

try {
  console.log("Seeding Chirp...");

  // Idempotent: refuse to stack a second seed on top of the first.
  const [{ count }] = await sql`select count(*)::int as count from profiles`;
  if (count > 0) {
    console.error(
      `profiles already has ${count} rows. Reset the database first (pnpm db:reset-local).`,
    );
    process.exit(1);
  }

  const now = Date.now();
  const userIds: string[] = [];
  const handles: string[] = [];

  for (const [displayName, username, lang] of NAMES) {
    const id = idAt(now - (60 - handles.length) * DAY);
    const isAr = lang === "ar";

    // Explicit columns: Supabase's auth schema expects them on hosted
    // projects, and they are harmless on local.
    const email = `${username}@example.test`;
    const at = new Date(now - (60 - handles.length) * DAY).toISOString();
    await sql`
      insert into auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at
      ) values (
        ${id}, '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', ${email}, '',
        ${at}, ${at}, ${at}
      )
    `;

    await sql`
      update profiles set
        username = ${username},
        display_name = ${displayName},
        bio = ${isAr ? "نكتب عن التقنية والحياة في المغرب." : "Writing about code, cities and small details."},
        preferred_langs = ${isAr ? sql`array['ar','en']` : sql`array['en','ar']`},
        onboarded_at = ${new Date(now - (60 - handles.length) * DAY).toISOString()}
      where id = ${id}
    `;

    userIds.push(id);
    handles.push(username);
  }

  await sql`
    insert into topics ${sql(TOPICS.map(([slug, nameEn, nameAr]) => ({ slug, name_en: nameEn, name_ar: nameAr })))}
  `;

  const chirpIds: { id: string; authorId: string; isRoot: boolean; at: number }[] = [];
  const rootIds: string[] = [];

  for (let i = 0; i < 400; i++) {
    const authorIndex = i % userIds.length;
    const authorId = userIds[authorIndex]!;
    const at = now - Math.floor(Math.random() * 3 * DAY) - i * 60_000;
    const isReply = i >= 240 && i % 5 !== 0 && rootIds.length > 0;
    const id = idAt(at);
    const body = chirpBody(i);

    if (isReply) {
      const parentId = rand(rootIds);
      await sql`
        insert into chirps (id, author_id, body, body_search, lang, reply_to_id, root_id, created_at)
        values (${id}, ${authorId}, ${body}, ${normalizeForSearch(body)}, ${detectLang(body)},
                ${parentId}, ${parentId}, ${new Date(at).toISOString()})
      `;
    } else {
      await sql`
        insert into chirps (id, author_id, body, body_search, lang, created_at)
        values (${id}, ${authorId}, ${body}, ${normalizeForSearch(body)}, ${detectLang(body)}, ${new Date(at).toISOString()})
      `;
      rootIds.push(id);
    }

    chirpIds.push({ id, authorId, isRoot: !isReply, at });
  }

  // The reply_count trigger kept each parent correct as replies were inserted;
  // this is a cheap assertion, not a fix-up.
  const [{ mismatches }] = await sql`
    select count(*)::int as mismatches
    from chirps c
    where c.reply_count <> (
      select count(*)::int from chirps r
      where r.reply_to_id = c.id and r.deleted_at is null
    )
  `;
  if (mismatches > 0) {
    throw new Error(`reply_count mismatch on ${mismatches} chirps`);
  }

  const follows = new Set<string>();
  for (let i = 0; i < 600; i++) {
    const follower = rand(userIds);
    const followee = rand(userIds);
    if (follower === followee) continue;
    const key = `${follower}:${followee}`;
    if (follows.has(key)) continue;
    follows.add(key);
    await sql`insert into follows (follower_id, followee_id) values (${follower}, ${followee})`;
  }

  const likes = new Set<string>();
  for (let i = 0; i < 2000; i++) {
    const userId = rand(userIds);
    const chirpId = rand(rootIds);
    const key = `${userId}:${chirpId}`;
    if (likes.has(key)) continue;
    likes.add(key);
    await sql`insert into likes (user_id, chirp_id) values (${userId}, ${chirpId})`;
  }

  for (const userId of userIds) {
    const picks = sample(TOPICS, 3);
    await sql`
      insert into user_topics ${sql(picks.map(([slug]) => ({ user_id: userId, topic_slug: slug })))}
      on conflict do nothing
    `;
  }

  const suggested = sample(userIds, 20);
  for (const [index, profileId] of suggested.entries()) {
    const [slug] = rand(TOPICS);
    await sql`
      insert into suggested_accounts (profile_id, topic_slug, rank)
      values (${profileId}, ${slug}, ${index})
      on conflict do nothing
    `;
  }

  const [stats] = await sql`
    select
      (select count(*)::int from profiles) as profiles,
      (select count(*)::int from chirps) as chirps,
      (select count(*)::int from follows) as follows,
      (select count(*)::int from likes) as likes,
      (select count(*)::int from user_topics) as user_topics
  `;

  console.log(
    `Seeded ${stats.profiles} profiles, ${stats.chirps} chirps, ${stats.follows} follows, ${stats.likes} likes, ${stats.user_topics} topic picks.`,
  );
} finally {
  await sql.end();
}
