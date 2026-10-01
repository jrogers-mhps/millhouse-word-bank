import { getDatabase } from "@netlify/database";

// The custom_words table is created automatically by the migration in
// netlify/database/migrations/ — no need to create it here.

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default async (req: Request) => {
  const db = getDatabase();

  if (req.method === "GET") {
    const rows = await db.sql`
      SELECT stage, topic_slug, word_class, word
      FROM custom_words
      ORDER BY created_at ASC
    `;
    return json(rows);
  }

  if (req.method === "POST") {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid request body" }, 400);
    }

    const { pin, stage, topic_slug, word_class, word } = body || {};

    // The PIN is only ever checked here, server-side, against an env var —
    // it is never embedded in the page itself.
    if (!process.env.TEACHER_PIN) {
      return json({ error: "TEACHER_PIN is not set on this site" }, 500);
    }
    if (pin !== process.env.TEACHER_PIN) {
      return json({ error: "Incorrect PIN" }, 401);
    }
    if (!stage || !topic_slug || !word_class || !word || !String(word).trim()) {
      return json({ error: "Missing fields" }, 400);
    }

    await db.sql`
      INSERT INTO custom_words (stage, topic_slug, word_class, word)
      VALUES (${stage}, ${topic_slug}, ${word_class}, ${String(word).trim()})
    `;
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/words" };
