<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Review and merge

Reviewers: fill in [docs/review-pass.md](docs/review-pass.md) for your PASS. Do not merge without a filled PASS from FE Designer and Preview QA.

### Rules

Each row names the test file that fails when the rule is broken, or `untestable` with a reason. `tests/agents-rules.test.ts` fails if a row has neither.

| Rule                                                                                                                                         | Test                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Live site is https://jarrodtran.com. Deploy BASE_PATH empty. Prefixed CI is a build check, not a preview. Do not hardcode /Personal-Website. | `tests/base-path.test.ts`                                               |
| 404 tab title uses title.absolute. Do not inherit the home documentTitle.                                                                    | `tests/page-titles.test.ts`                                             |
| Dark tokens paint without JS (prefers-color-scheme on html:not(.light)).                                                                     | `tests/theme-no-js.test.ts`                                             |
| Icon, OG, and CSS colors stay on the shared palette.                                                                                         | `tests/palette.test.ts`                                                 |
| Official title stays Lead, AI Enablement & Factory Strategy.                                                                                 | `tests/copy-contract.test.ts`                                           |
| Every site figure is in the resume or has a recorded source.                                                                                 | `tests/metric-ledger.test.ts`                                           |
| No em-dashes in content files or rendered pages.                                                                                             | `tests/copy-contract.test.ts`                                           |
| No factory, manufacturing, or heavy operational framing in visitor copy.                                                                     | `tests/copy-contract.test.ts`                                           |
| One public narrative. Do not repeat a five-word phrase unless it carries a figure.                                                           | `tests/copy-contract.test.ts`                                           |
| Do not invent career facts.                                                                                                                  | untestable: only Jarrod can confirm employers, titles, and dates        |
| /writing/ and /work/ stay meta-refresh. Case studies stay at /work/[slug]/.                                                                  | `tests/legacy-redirects.test.ts` `tests/legacy-redirect-routes.test.ts` |
| Do not edit DNS, the custom domain, or GitHub Pages settings.                                                                                | untestable: those settings live outside this repo                       |
| Visible links and buttons are at least 44px tall at 390.                                                                                     | `tests/tap-targets.test.ts`                                             |
| Body text meets WCAG AA contrast in light and dark.                                                                                          | `tests/contrast.test.ts`                                                |
| Icon and OG images stay on palette A with no tinted pixels.                                                                                  | `tests/generated-images.test.ts`                                        |
| Do not ship a photo of Jarrod.                                                                                                               | `tests/no-photo.test.ts`                                                |
