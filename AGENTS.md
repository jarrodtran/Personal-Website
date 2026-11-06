<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Review and merge

Reviewers: fill in [docs/review-pass.md](docs/review-pass.md) for your PASS. Do not merge without a filled PASS from FE Designer and Preview QA.

### Gates

`main` requires the `gates` status. It turns green only when all three gates are posted **as plain PR comments** (not review bodies, not the PR description), one line each, at the PR's current head SHA:

```
GATE design PASS <40-character head sha>
GATE qa PASS <40-character head sha>
GATE review PASS <40-character head sha> touches: none
```

- `design` is FE Designer, `qa` is Preview QA, `review` is code review.
- `review` must end with `touches: none`. Changing data, DNS, or money on purpose is `touches: data`, `touches: dns`, or `touches: money`, which keeps the gate red by design.
- Only comments from `jarrodtran` or `cursor[bot]` count. Anyone else's line is ignored.
- Do not edit a gate comment after posting: an edited comment stops counting, and the gate reports it as missing.
- The verdict must match the head commit. Any new commit makes all three stale, so re-post them for the new SHA. `gh pr view <number> --json headRefOid --jq .headRefOid` prints it.
- The `gates` status description names what is blocking, for example `design missing; qa missing; review missing` or `design PASS <old> stale`.

### Rules

Each row names the test file that fails when the rule is broken, or `untestable` with a reason. Testable rows carry a short `rule:` id. The named test file must mention that id. `tests/agents-rules.test.ts` fails if a row has neither a test file nor an untestable marker, if a testable row lacks an id or reuses one, or if a named test does not mention its row's id.

| Rule                                                                                                                                                                    | Test                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `rule:live-site-base-path` Live site is https://jarrodtran.com. Deploy BASE_PATH empty. Prefixed CI is a build check, not a preview. Do not hardcode /Personal-Website. | `tests/base-path.test.ts`                                               |
| `rule:404-title-absolute` 404 tab title uses title.absolute. Do not inherit the home documentTitle.                                                                     | `tests/page-titles.test.ts`                                             |
| `rule:theme-no-js` Dark tokens paint without JS (prefers-color-scheme on html:not(.light)).                                                                             | `tests/theme-no-js.test.ts`                                             |
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
| `rule:gates-at-head` A gate counts only for the PR head SHA, from an allowlisted comment that was not edited.                                                           | `tests/gates.test.ts`                                                   |
| `rule:home-height` Home may be at most 700px taller than main at 640+ with 100% text; must stay shorter at 320 and 390; shorter at every width with 200% text.          | `tests/home-writing-first.test.ts`                                      |
| `rule:contrast-aa` Body text meets WCAG AA contrast in light and dark.                                                                                                  | `tests/contrast.test.ts`                                                |
| `rule:generated-images-palette` Icon and OG images stay on palette A with no tinted pixels.                                                                             | `tests/generated-images.test.ts`                                        |
| `rule:no-photo` Do not ship a photo of Jarrod.                                                                                                                          | `tests/no-photo.test.ts`                                                |
