<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

| Rule | Fails |
| --- | --- |
| Live site is `https://jarrodtran.com`. Deploy `BASE_PATH` empty. Prefixed CI is a build check, not a preview. Do not hardcode `/Personal-Website`. | `tests/base-path.test.ts` |
| 404 tab title uses `title.absolute`. Do not inherit the home `documentTitle`. | `pnpm test:titles` |
| Dark tokens paint without JS (`prefers-color-scheme` on `html:not(.light)`). Match `lib/palette.ts`. | `pnpm test:theme`, `tests/palette.test.ts` |
| Official title stays `Lead, AI Enablement & Factory Strategy`. No invented figures. No em-dashes. | Title and em-dashes: `tests/copy-contract.test.ts`. Figures: `tests/metric-ledger.test.ts`. |
| Do not invent career facts. | Can't be tested. Only Jarrod changes career facts. |
| `/writing/` and `/work/` stay meta-refresh. One site-wide canonical. Case studies stay at `/work/[slug]/`. | `pnpm test:redirects` |
| Do not edit DNS, the custom domain, or GitHub Pages settings. | Can't be tested. Only Jarrod changes these settings. |
| Visible links and buttons are at least 44px tall at 390. | `pnpm test:tap` |
| Body text meets WCAG AA contrast in light and dark. | `tests/contrast.test.ts` |
| Icon and OG images stay on palette A with no tinted pixels. | `pnpm test:images` |
| Home JS stays under 150 kB gzip. | `pnpm size` |
