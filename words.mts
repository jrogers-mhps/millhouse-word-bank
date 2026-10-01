import { getDatabase } from "@netlify/database";

// custom_words, removed_words and custom_topics are created automatically
// by the migrations in netlify/database/migrations/.

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function slugify(label: string) {
  const base = "ct" + label.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);
  return base || "cttopic";
}

export default async (req: Request) => {
  const db = getDatabase();

  if (req.method === "GET") {
    const [added, removed, topics] = await Promise.all([
      db.sql`SELECT stage, topic_slug, word_class, word FROM custom_words ORDER BY created_at ASC`,
      db.sql`SELECT stage, topic_slug, word_class, word FROM removed_words ORDER BY created_at ASC`,
      db.sql`SELECT slug, label, stage FROM custom_topics ORDER BY created_at ASC`,
    ]);
    return json({ added, removed, topics });
  }

  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const { pin, action } = body || {};

    // The PIN is only ever checked here, server-side, against an env var —
    // it is never embedded in the page itself.
    if (!process.env.TEACHER_PIN) {
      return json({ error: "TEACHER_PIN is not set on this site" }, 500);
    }
    if (pin !== process.env.TEACHER_PIN) {
      return json({ error: "Incorrect PIN" }, 401);
    }

    if (action === "add_topic") {
      const { stage, label } = body || {};
      if (!stage || !label || !String(label).trim()) {
        return json({ error: "Missing fields" }, 400);
      }
      const cleanLabel = String(label).trim();
      let slug = slugify(cleanLabel);
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await db.sql`INSERT INTO custom_topics (slug, label, stage) VALUES (${slug}, ${cleanLabel}, ${stage})`;
          return json({ ok: true, slug, label: cleanLabel, stage });
        } catch (e: any) {
          // Unique violation on slug — try again with a short random suffix.
          slug = slugify(cleanLabel) + Math.random().toString(36).slice(2, 5);
        }
      }
      return json({ error: "Could not create a unique topic — try a different name" }, 500);
    }

    const { stage, topic_slug, word_class, word } = body || {};
    if (!stage || !topic_slug || !word_class || !word || !String(word).trim()) {
      return json({ error: "Missing fields" }, 400);
    }
    const cleanWord = String(word).trim();

    if (action === "remove") {
      // Also remove it from custom_words if a teacher is deleting one of
      // their own earlier additions — keeps the data tidy either way.
      await db.sql`
        DELETE FROM custom_words
        WHERE stage=${stage} AND topic_slug=${topic_slug} AND word_class=${word_class}
          AND lower(word)=lower(${cleanWord})
      `;
      await db.sql`
        INSERT INTO removed_words (stage, topic_slug, word_class, word)
        VALUES (${stage}, ${topic_slug}, ${word_class}, ${cleanWord})
      `;
      return json({ ok: true });
    }

    await db.sql`
      INSERT INTO custom_words (stage, topic_slug, word_class, word)
      VALUES (${stage}, ${topic_slug}, ${word_class}, ${cleanWord})
    `;
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/words" };
