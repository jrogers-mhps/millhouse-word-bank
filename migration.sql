CREATE TABLE IF NOT EXISTS custom_words (
  id SERIAL PRIMARY KEY,
  stage TEXT NOT NULL,
  topic_slug TEXT NOT NULL,
  word_class TEXT NOT NULL,
  word TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
