<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Review and merge

Reviewers: fill in [docs/review-pass.md](docs/review-pass.md) for your PASS. Do not merge without Design, Preview QA, and Review Poteto all PASS the same head, with `touches: none`.

### Gates

`main` requires the `gates` status. Grading uses `scripts/gates.mjs` from the PR base ref, which keeps grading independent of the proposed changes. It turns green only when Design, Preview QA, and Review Poteto all PASS that same head, and Review Poteto includes `touches: none`.

The Cursor reviewer app (`cursor[bot]`) posts the three verdicts when it approves a PR; a person on the allowlist can post them by hand instead. Post each verdict as its own plain PR comment. A review body and the PR description do not count. One line each, using the current 40-character head SHA:

```
GATE design PASS <40-character head sha>
GATE qa PASS <40-character head sha>
GATE review PASS <40-character head sha> touches: none
```

- `design` is Design, `qa` is Preview QA, and `review` is Review Poteto.
- Review Poteto passes only with `touches: none`. `touches: data`, `touches: dns`, and `touches: money` stay red on purpose. A review PASS with no touches value stays red (`missing touches: none`).
- Only comments from `jarrodtran` or `cursor[bot]` count. Any other author is ignored, including an agent that reviews under its own account.
- Do not edit a gate comment after posting. An edited comment is ignored.
- The newest countable verdict for the current head decides each gate. A verdict for an older commit is reported as stale only when there is no current-head verdict.
- A line passes only when its SHA equals the PR head. Any new commit makes all three stale, so post them again for the new SHA. `gh pr view <number> --json headRefOid --jq .headRefOid` prints it.
- The status description names the blocker. Examples: `design missing; qa missing; review missing` and `design PASS <old sha> stale`.

Filling in [docs/review-pass.md](docs/review-pass.md) does not post a GATE line, and it does not turn `gates` green.

### Rules

Each row names the test file that fails when the rule is broken, or `untestable` with a reason. Testable rows carry a short `rule:` id. The named test file must mention that id. `tests/agents-rules.test.ts` fails if a row has neither a test file nor an untestable marker, if a testable row lacks an id or reuses one, or if a named test does not mention its row's id.

| Rule                                                                                                                                                                    | Test                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `rule:live-site-base-path` Live site is https://jarrodtran.com. Deploy BASE_PATH empty. Prefixed CI is a build check, not a preview. Do not hardcode /Personal-Website. | `tests/base-path.test.ts`                                               |
| `rule:404-title-absolute` 404 tab title uses title.absolute. Do not inherit the home documentTitle.                                                                     | `tests/page-titles.test.ts`                                             |
| `rule:theme-no-js` Dark tokens paint without JS (color-scheme: light dark and light-dark()).                                                                             | `tests/theme-no-js.test.ts`                                             |
| `rule:theme-toggle-pressed` With prefers-color-scheme dark, after idle `Toggle color theme` has aria-pressed true when html has class dark.                              | `tests/theme-toggle-pressed.test.ts`                                     |
| `rule:shared-palette` Icon, OG, and CSS colors stay on the shared palette.                                                                                              | `tests/palette.test.ts`                                                 |
| `rule:official-title` Official title stays Lead, AI Enablement & Factory Strategy.                                                                                      | `tests/copy-contract.test.ts`                                           |
| `rule:metric-ledger` Every site figure is in the resume or has a recorded source.                                                                                       | `tests/metric-ledger.test.ts`                                           |
| `rule:no-em-dashes` No em-dashes in content files or rendered pages.                                                                                                    | `tests/copy-contract.test.ts`                                           |
| `rule:banned-copy` No banned phrase, em-dash, or en-dash in site copy or built HTML.                                                                                    | `tests/banned-copy.test.ts`                                             |
| `rule:no-factory-framing` No factory, manufacturing, or heavy operational framing in visitor copy.                                                                      | `tests/copy-contract.test.ts`                                           |
| `rule:one-public-narrative` One public narrative. Do not repeat a five-word phrase unless it carries a figure.                                                          | `tests/copy-contract.test.ts`                                           |
| Do not invent career facts.                                                                                                                                             | untestable: only Jarrod can confirm employers, titles, and dates        |
| `rule:legacy-redirects` /writing/ and /work/ stay meta-refresh. Case studies stay at /work/[slug]/.                                                                     | `tests/legacy-redirects.test.ts` `tests/legacy-redirect-routes.test.ts` |
| Do not edit DNS, the custom domain, or GitHub Pages settings.                                                                                                           | untestable: those settings live outside this repo                       |
| `rule:tap-targets-44px` Visible links, buttons, and inputs are at least 44 by 44. Skip inline prose links and visually hidden controls.                                 | `tests/tap-targets.test.ts`                                             |
| `rule:no-horizontal-overflow` Built pages do not overflow the viewport horizontally across widths, text sizes, and themes.                                              | `tests/tap-targets.test.ts`                                             |
| `rule:gates-at-head` A gate passes only when its newest allowlisted, unedited verdict at the PR head is PASS. Review Poteto also needs `touches: none`.                   | `tests/gates.test.ts`                                                   |
| `rule:home-height` Home may be at most 700px taller than main at 640+ with 100% text; must stay shorter at 320 and 390; shorter at every width with 200% text.         | `tests/home-writing-first.test.ts`                                      |
| `rule:contrast-aa` Body text meets WCAG AA contrast in light and dark.                                                                                                  | `tests/contrast.test.ts`                                                |
| `rule:generated-images-palette` Icon and OG images stay on palette A with no tinted pixels.                                                                             | `tests/generated-images.test.ts`                                        |
| `rule:no-photo` Do not ship a photo of Jarrod.                                                                                                                          | `tests/no-photo.test.ts`                                                |
