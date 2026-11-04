# jarrodtran.com

Personal site for [Jarrod Tran](https://jarrodtran.com) — product and strategy operator. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4. Statically exported to GitHub Pages.

## Customize

Positioning rules, the factory-language ban, the number ledger, and ready-to-paste Plan / Build prompts live in [`POSITIONING.md`](POSITIONING.md). Keep one public narrative.

Almost everything you will change lives in two places:

1. **Copy and data** — [`content/site.ts`](content/site.ts)
   - Official current title: `currentTitle` at the top of the file. It feeds the hero, bio, Experience, and JSON-LD.
   - Name, headline, page title (`documentTitle`, 60 characters at most), status badge
   - Highlight stats, bio, experience (roles grouped under each employer), selected work (with its proof panel), principles, capabilities
   - Section eyebrows, titles, and descriptions on `site.sections` (numbered in page order)
   - Contact links, résumé path and download filename, and `calendar` (the contact panel shows a booking link only when it is set)
   - `headlineVariants` and `audiences` tags are unused internal data — do not ship four public versions
2. **Accent color** — [`app/globals.css`](app/globals.css)
   - Change `--accent` (and `--ring`) under `:root` and `.dark`

Every figure on the site must also appear in the résumé source. Add numbers to the résumé first; `pnpm test` fails otherwise.

After copy edits: `pnpm test` (copy contract, number ledger, rendered sections), `pnpm check`, `pnpm lint`, `pnpm build`. The copy contract fails when a five-word phrase appears in more than one string, unless the phrase carries a figure.

## Local development

```bash
pnpm install
pnpm dev
```

Useful scripts: `pnpm check` (TypeScript), `pnpm lint`, `pnpm test`, `pnpm test:tap` (390px tap targets against `out/`), `pnpm build` (writes static files to `out/`), `pnpm format`, `pnpm lhci` (Lighthouse CI against `out/` - see below).

After a build:

- `pnpm a11y` runs axe on `out/` in Playwright Chromium at desktop and phone widths, in light and dark. Install the browser with `npx playwright install --with-deps chromium`. It also fails when:
  - an icon is squeezed or text overflows its control at 320px
  - the header clips its controls at 200% text
  - the page title is over 60 characters
  - a reveal animation hides content, or runs under reduced motion
  - the phone menu ignores Escape, drops focus, or stays open at desktop width
  - the phone menu cannot reach its last link on a short viewport
  - at 320x256 with 200% text the header grows past 184px, or Résumé sits outside the panel
  - the copy-email button does not announce success or failure
- `pnpm size` prints the JS and HTML bytes the home page loads, raw and gzip, and fails when the JS is over 150 kB gzip. Raise the budget in `scripts/js-size.mjs` only on purpose.

## CI and deploy

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, typecheck, tests, build, the 390px tap-target check (`pnpm test:tap`), the accessibility check (`pnpm a11y`, axe and page checks in Chrome against `out/`), and the JS budget (`pnpm size`) on every pull request.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the same gate on every push to `main`, then publishes `out/` to GitHub Pages. A failing check blocks the deploy. Production builds with an empty `BASE_PATH` so assets stay `/_next/...` at `https://jarrodtran.com`. Pull-request CI also rebuilds with `BASE_PATH=/Personal-Website` so a path-prefixed build still works. Pull requests do not deploy a preview.
- [`.github/workflows/lighthouse.yml`](.github/workflows/lighthouse.yml) builds the static export and runs [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) against `out/` on pull requests and `main`. Config lives in [`.lighthouserc.cjs`](.lighthouserc.cjs). Reports upload as the `lighthouse-results` workflow artifact.

### Lighthouse locally

```bash
pnpm build
pnpm lhci
```

That runs `@lhci/cli` against the same URLs and thresholds as CI (home + two case-study pages). Accessibility and SEO category floors fail the run; performance and best-practices are warn-only so Chrome-on-CI noise does not block merges.

## Analytics

Visitor analytics are **on hold**. Options and the no-paid-Plausible rule are in [`docs/analytics.md`](docs/analytics.md). Do not add tracking scripts until an explicit product choice.

## Domain status

**This repo is live at [jarrodtran.com](https://jarrodtran.com).** The 2026-10-16 cutover moved the custom domain off [`jarrodtran/Jobhuntsite`](https://github.com/jarrodtran/Jobhuntsite).

- Production deploy leaves `BASE_PATH` empty (or omits it). The export is a root site (`/_next/`, `/icon.png`). `tests/base-path.test.ts` fails if the deploy build sets `BASE_PATH=/Personal-Website`.
- `BASE_PATH=/Personal-Website` in pull-request CI is a prefixed-build check only. It is not a live preview. Do not copy that prefix into `deploy.yml`.
- `next.config.ts` reads `BASE_PATH` through `normalizeBasePath`. Do not hardcode the repo name.
- Leftover Jobhuntsite URLs `/writing/` and `/work/` meta-refresh to `/#writing` and `/#work`. Case studies stay at `/work/[slug]/`.
- Do not edit DNS, the custom domain, or GitHub Pages settings from an agent PR.
