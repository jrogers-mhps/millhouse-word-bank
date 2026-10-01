# Millhouse Word Bank — Teacher Zone setup

Good news: the Netlify side of this is already set up for your
`word-bank-millhouse` site —

- ✅ The Neon database extension is installed
- ✅ The `TEACHER_PIN` environment variable is set (1988)

**All that's left is deploying these files.**

## Deploy

1. Go to your site's dashboard: https://app.netlify.com/sites/word-bank-millhouse
2. Open the **Deploys** tab
3. Drag this whole folder (or a zip of it) onto the deploy area

That's it. On this first deploy, Netlify will:
- Install `@netlify/database` (listed in `package.json`)
- Run the migration in `netlify/database/migrations/` to create the
  `custom_words` table automatically
- Deploy `index.html` and the `words` function

## Using the Teacher Zone

On the live page, scroll to the footer and tap **Teacher Zone**. Enter the
PIN (1988), then pick a key stage, topic and word class, type a word or
phrase, and hit **Add word**. It saves straight to the database and shows
up for every visitor from then on — no redeploy needed.

## Changing the PIN later

Ask me to update it any time, or change it yourself from your site's
**Environment variables** settings in the Netlify dashboard — then redeploy
so the function picks up the new value.

## A note on the PIN

It's checked server-side, not just hidden in the page, so it's a
reasonable barrier — but treat it like a staffroom door code rather than a
real password. Anyone who's told the PIN can add words.

## Credits usage

Adding a word is a tiny database write — it does **not** trigger a
redeploy (the costly 15-credit action). Viewing the page reads a small
amount of data, billed as database bandwidth, not as a deploy. Realistic
classroom usage will use a tiny fraction of your free 300 credits/month.
