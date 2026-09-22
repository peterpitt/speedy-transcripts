# Speedy Transcripts

Build a SaaS landing page + authenticated app shell for Video Speed Reader, a product that turns any video into an accurate transcript in three minutes, targeted at content creators, educators, and engineers who record long-form video and need a fast, clean transcript to repurpose into blog posts, course notes, or searchable archives.

The site must include:

1. A public landing page (`/`) with:

   - Hero section: product name "Video Speed Reader" prominently displayed, value prop "上傳影片，三分鐘內拿到逐字稿。" (English subtitle: "Upload your video, get a clean transcript in three minutes."), and a primary CTA button labeled "Sign in / 登入" in the top-right header

   - Features section with exactly 3 feature cards:

     * Card 1: "高準確度逐字稿 (High-accuracy transcripts)" — powered by OpenAI Whisper, supports Chinese and English

     * Card 2: "三分鐘交付 (Three-minute turnaround)" — processed in the background, you get an email when it's ready

     * Card 3: "可商用授權 (Commercial-use ready)" — you own the output, use it however you like

   - Footer with copyright "© 2026 Video Speed Reader"

2. Authentication using Supabase (email + password), backed by the project owner's own Supabase project:

   - Sign Up page with email + password

   - Sign In page with email + password

   - Sign Out functionality

   - Email confirmation can be disabled for simplicity in this v1

3. An authenticated app shell at `/app` that the user lands on after signing in:

   - Greets the signed-in user by email: "Hi {user.email}"

   - A placeholder message: "Your dashboard is coming soon. Upload functionality will be added in the next milestone."

   - A Sign Out button in the header

Design requirements:

- Modern, professional dark theme (purple/violet accent on a near-black background)

- Use Inter or a similar sans-serif font

- Mobile responsive

- Tasteful subtle animations (fade-in on scroll is fine; don't overdo it)

Out of scope for this v1: video upload widget, transcript display, payment, custom database tables (do NOT create a `profiles` or `videos` table — only use Supabase's default `auth.users`). Those come in later milestones. Stick to landing page + auth + placeholder dashboard.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

---

## Tech stack & local development

This project is a **plain Vite + React single-page app (SPA)** — no SSR, no
TanStack Start, no Cloudflare/Wrangler. It is designed for static hosting on
Vercel.

- **Build tool:** Vite (`vite build` → static `dist/`)
- **UI:** React 19 + shadcn/ui (Radix) + Tailwind CSS v4
- **Routing:** React Router (`react-router-dom`) — client-side routes:
  - `/` — public landing page
  - `/auth` — combined sign-in / sign-up screen
  - `/sign-in`, `/sign-up` — deep links into the auth screen (same UI)
  - `/app` — authenticated dashboard (guarded, redirects to `/auth` when signed out)
- **Auth / data:** Supabase (`@supabase/supabase-js`)
- **Data fetching:** TanStack Query

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

### Environment variables

Client-side Supabase config is read from Vite env vars (see `.env`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

On Vercel, set these in **Project Settings → Environment Variables** (or keep
them in `.env` since the publishable key is client-safe).

## Deploying to Vercel

The repo builds to a static SPA and includes `vercel.json`:

- `framework: vite`, `buildCommand: vite build`, `outputDirectory: dist`
- A SPA rewrite (`/(.*) → /index.html`) so deep links like `/app` resolve
  client-side instead of 404-ing.

Import the repo in Vercel and deploy — no extra configuration required.
