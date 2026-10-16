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
| Official title stays `Lead, AI Enablement & Factory Strategy`. No invented facts or figures. No em-dashes. | `tests/copy-contract.test.ts`, `tests/metric-ledger.test.ts` |
| `/writing/` and `/work/` stay meta-refresh. One site-wide canonical. Case studies stay at `/work/[slug]/`. | `pnpm test:redirects` |
| Do not edit DNS, the custom domain, or GitHub Pages settings. | `tests/base-path.test.ts` |
| Home JS stays under 150 kB gzip. | `pnpm size` |
