# Mijn Woordenboek

*A little Dutch every day.* A mobile-first Progressive Web App for collecting Dutch vocabulary
day by day and reviewing it with flip cards. Interface in English, translations in Chinese.

- Add a handful of words per day (Dutch word, Chinese translation, Dutch example, optional Chinese example).
- Tap a card to flip it and see the example sentence.
- Browse days with ← / → or the calendar (days with words are highlighted).
- Review all words or a single day, in order or shuffled.
- Export / import a JSON backup.
- Works fully offline once loaded; installable to the iPhone / iPad Home Screen.

No account, no server: all data is stored locally in the browser (IndexedDB).

## Tech stack

React 19 + TypeScript · Vite · Tailwind CSS v4 · Dexie.js (IndexedDB) · vite-plugin-pwa (Workbox) ·
React Router (hash routing) · Lucide icons · Vitest + Testing Library · Playwright.

UI primitives (button, modal, confirm dialog) live in `src/components/ui/` and follow the shadcn/ui
style, but are hand-written to avoid extra dependencies.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev            # http://localhost:5173
```

To try it on your phone during development: `npm run dev -- --host`, then open the shown network
URL on the iPhone (same Wi-Fi). Note that the service worker / install only work over HTTPS
(or on `localhost`), so use a deployed build to test installation.

## Adding words with JSON files

Besides typing words in the app, you can write them as files. One file per day, in a year/month folder:

```text
src/words/
  2026/
    10/
      2026-10-30.json
      2026-10-31.json
    11/
      2026-11-01.json
```

```json
[
  {
    "dutch": "gezellig",
    "chinese": "温馨的、愉快的",
    "exampleDutch": "Het is gezellig bij ons thuis.",
    "exampleChinese": "我们家里很温馨。"
  }
]
```

- The date comes from the file name (`YYYY-MM-DD.json`). The file must sit in the matching
  `YYYY/MM/` folder; `npm run check-words` tells you if one is misplaced.
- `exampleChinese` is optional; the other fields are required.
- `npm run new-day` creates today's file with an empty template (`npm run new-day -- 2026-11-02` for another date).
- `npm run check-words` validates every file and tells you which word is wrong.

When the app starts it syncs these files into its saved words: new words are added, words changed
in a file are updated, and words removed from a file are removed from the app. Words added in the app
itself are never touched. A word is identified by its date + Dutch spelling, so fixing a typo in
`dutch` counts as removing the old word and adding a new one.

The files are compiled into the app, so after editing them the change appears on your devices
**after you rebuild and redeploy** (`npm run build`, then upload `dist/`). In `npm run dev` it
shows up on reload.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check and build to `dist/` (includes service worker + manifest) |
| `npm run preview` | Serve the production build locally on http://localhost:4173 |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm test` | Unit / component tests (Vitest, jsdom, fake-indexeddb) |
| `npm run test:e2e` | End-to-end tests (Playwright: desktop Chromium, iPhone + iPad WebKit) |
| `npm run icons` | Regenerate PNG icons from `public/icons/favicon.svg` |

First time running E2E tests: `npx playwright install chromium webkit`.

## Deployment

The build output in `dist/` is a static site. It uses relative paths and hash routing
(`/#/review`), so it works at a domain root or in a sub-folder, with no rewrite rules.
**It must be served over HTTPS** for the service worker and Home Screen install to work.

This repo deploys automatically to **GitHub Pages** on every push to `main`
(`.github/workflows/deploy.yml`: checks the word files, lints, tests, builds, publishes) at
https://piupiuisland.github.io/ronnie_woorden/. One-time setup: in the repo on GitHub, open
*Settings → Pages* and set *Source* to **GitHub Actions**.

Other static hosts work too. Examples:

- **Netlify / Cloudflare Pages / Vercel**: build command `npm run build`, output directory `dist`.
- **GitHub Pages**: run `npm run build` and publish the `dist/` folder (e.g. with the
  `actions/deploy-pages` workflow).
- **Your own server**: copy `dist/` to any HTTPS web root. Make sure `sw.js` is not cached for a
  long time (e.g. `Cache-Control: no-cache` for `sw.js`) so updates are picked up.

### Updates

When a new version is deployed, the service worker downloads it in the background and the app
updates automatically on the next launch. Your words are not affected by updates.

## Install on iPhone / iPad

1. Open the deployed URL in **Safari**.
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Launch *Woordenboek* from the Home Screen. It opens full-screen and works offline.

On a Mac: in Safari choose **File → Add to Dock**, or in Chrome use the install icon in the address bar.

## Your data — please read

- Words are stored in IndexedDB **on that device, in that browser only**. The iPhone, iPad and Mac
  each have their own separate collection; there is **no automatic sync**.
- To move words between devices: *Settings → Export backup* on one device (on iPhone/iPad this
  opens the share sheet — use *Save to Files* or AirDrop), then *Settings → Import backup* on the other.
  Choose **Add to my words** to merge (words with the same ID are skipped, so importing twice never
  creates duplicates) or **Replace all my words** to start from the backup.
- Clearing Safari website data, using Private Browsing, or deleting the Home Screen app can remove
  your words. Safari may also clear data of websites you don't visit for several weeks; the
  installed Home Screen app is exempt from that, so install it and keep regular backups.
- The app asks the browser for *persistent storage* on launch to reduce the chance of eviction.

### Backup format

```json
{
  "app": "mijn-woordenboek",
  "formatVersion": 1,
  "exportedAt": "2026-10-30T19:00:00.000Z",
  "appVersion": "1.0.0",
  "vocabulary": [
    {
      "id": "…uuid…",
      "date": "2026-10-30",
      "dutch": "gezellig",
      "chinese": "温馨的、愉快的",
      "exampleDutch": "Het is gezellig bij ons thuis.",
      "exampleChinese": "我们家里很温馨。",
      "createdAt": "2026-10-30T18:12:00.000Z",
      "updatedAt": "2026-10-30T18:12:00.000Z"
    }
  ]
}
```

Invalid records are skipped and counted in the import result.

## Project structure

```text
src/
  components/       VocabularyCard, VocabularyGrid, VocabularyForm, DateNavigator, CalendarPicker
  components/ui/    Button, Modal, ConfirmDialog
  pages/            HomePage, ReviewPage, SettingsPage
  db/database.ts    Dexie schema (versioned) + CRUD functions
  hooks/            live IndexedDB queries, selected-date state (kept in the URL)
  lib/              dates (local-calendar helpers), backup, validation, shuffle, download
  types/            Vocabulary model
tests/unit/         Vitest tests
tests/e2e/          Playwright tests
```

### Dates

Dates are stored as `YYYY-MM-DD` strings in the **local** calendar. The code never parses them via
UTC (`new Date('2026-10-30')` / `toISOString()`), so a word added late in the evening stays on the
right day. See `src/lib/dates.ts` and `tests/unit/dates.test.ts`.

### Schema changes

The database schema is versioned in `src/db/database.ts`. To change it, add a new
`this.version(n + 1).stores(...)` (with an `.upgrade()` if data must be migrated); never edit an
existing version.
