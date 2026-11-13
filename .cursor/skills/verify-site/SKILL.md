---
name: verify-site
description: "Drive the public jarrodtran.com Next.js site (the static export) in a browser to prove theme, navigation, case studies, and contact behavior. Use when a change to visitor-facing UI, copy, or routes needs a scripted launch, doctor, and evidence capture."
---

# Verify the public site

The visitor surface is the static export of jarrodtran.com (package `jarrodtran-com`). Production is `pnpm build` with an empty `BASE_PATH`, then the files in `out/`. This skill builds that export, serves it on `127.0.0.1`, and drives it with Playwright through the `verify-site` helper.

There is no account, database, or seed script. Page copy is compiled from `content/site.ts`. The Writing section is filled at build time from `https://jarrodtran.substack.com/feed` (`lib/writing.ts`). A failed feed still ships the home page, with the empty sentence `First post coming soon. Subscribe to get it by email.`

Do not deploy, and do not edit DNS, the custom domain, or GitHub Pages. Do not invent employers, titles, dates, or figures. Quote only strings the page already renders.

Other surfaces this skill does not drive:

- `pnpm dev` starts `next dev` on port 3000 and hostname `0.0.0.0` unless `PORT`, `--port`, or `--hostname` is set. It writes its pid, port, and URL to `.next/dev/lock`. A second `next dev` does not create an isolated site; it prints the existing server. Do not attach to a dev server this run did not start, and do not kill it by process name.
- `pnpm build` takes `.next/lock`. A second build fails while that lock is held. Dev and build use different output directories (`.next/dev` and `.next`), so a visitor's `next dev` can stay up while this skill builds. Do not signal that dev process.
- `pnpm start` is `npx serve out`. Verification does not use it. The helper serves `out/` itself so the run owns the pid and the port.
- The live site at `https://jarrodtran.com` is not a local instance. Do not point these commands at it.

Read `features/README.md` before driving. Then follow one feature file. A passing entry point does not cover the other entry points in that file.

## Launch

From the repo root:

```bash
.cursor/skills/verify-site/scripts/verify-site.mjs launch
```

If `node_modules/next` is missing, run `pnpm install --frozen-lockfile` first. If Playwright Chromium is missing, run `pnpm exec playwright install chromium`. If Chromium then fails to start because a shared library is missing, run `pnpm exec playwright install --with-deps chromium`.

Launch does all of the following:

1. Refuses when the current run is already alive. A second server needs `VERIFY_SITE_RUN_ID` set to a new token, and it must wait until the first launch has printed `ready` or failed. Two builds cannot hold `.next/lock` together.
2. Runs `pnpm build` with `BASE_PATH` and `NEXT_PUBLIC_BASE_PATH` cleared and `WRITING_FEED_PATH` removed, so the export matches production rather than the pull-request prefix `/Personal-Website` or a test fixture feed. `NEXT_TELEMETRY_DISABLED` is set to `1`.
3. Serves `out/` on `127.0.0.1` and an ephemeral port (`VERIFY_SITE_PORT` pins one). Unknown paths return `out/404.html` with status 404, which is the visitor 404. The repo's Vitest servers return an empty 404 instead; do not copy that into this helper.
4. Runs doctor. The launch command prints `verify-site: ready http://127.0.0.1:<port> run=<id>` only after doctor prints `doctor: ok`.

Ready means the home page, the featured case study, the résumé PDF, the 404 page, and the `/writing/` and `/work/` refresh pages all answered. A listening socket is not ready. `verify-site: listening` in the server log is only the bind. Wait for `verify-site: ready`.

There is no data directory to migrate. The build recreates `out/`. Theme state lives in the browser profile for that run, under the run directory, and starts empty.

Run directory (this Linux environment, when `TMPDIR` is unset): `/tmp/verify-site/<id>/`. Launch prints `runDir:`. Cleanup, doctor, and browser commands must see the same `TMPDIR` as launch. The helper reads `/proc/<pid>/cmdline` and is written for Linux.

## Doctor

```bash
.cursor/skills/verify-site/scripts/verify-site.mjs doctor
```

Doctor is read-only. It fails unless every line below is true:

- The server pid from the run's `state.json` is alive and its command line includes `verify-site.mjs`.
- `GET /` returns 200, the `x-verify-site-run` header equals this run id, and the body hash equals both `out/index.html` and the hash recorded at launch.
- The home `<title>` is exactly `Jarrod Tran · Product & strategy · Tesla, Apple, Waymo`.
- The home HTML contains `aria-label="Toggle color theme"` and does not contain `/Personal-Website/_next`.
- `GET /work/tesla-energy-ai-product/` returns 200 and contains `Tesla Energy: AI product that got used · Jarrod Tran`.
- `GET /resume.pdf` returns 200, `content-type` includes `application/pdf`, and the body starts with `%PDF-`.
- `GET /no-such-page/` returns 404 and contains `Page not found · Jarrod Tran`.
- `GET /writing/` returns 200 and contains `url=/#writing`. `GET /work/` returns 200 and contains `url=/#work`.
- `node_modules/next/package.json` still matches the version recorded at launch. This checkout resolves that package at 16.4.5 until a later install changes it.
- `playwright-core`'s Chromium executable exists on disk.

Doctor also prints `writing: empty` or `writing: posts`. Neither value fails doctor. A journey that needs posts must stop when the line says `empty`.

An instance that fails doctor is not worth driving. Do not point the browser at another origin to work around it.

## Drive

The helper's first `browser` command starts a headless Chromium daemon for this run. Later commands reuse the same page. `browser context` closes that context and opens a fresh one, which drops `localStorage`.

Default context, used when a command runs before `browser context`: color scheme `light`, JavaScript on, viewport `1280x800`, reduced motion `reduce`, clipboard permission off. Flags you omit on a later `browser context` reset to those defaults. They do not keep the previous context's values.

Reduced motion makes hash scrolling instant (`scroll-behavior: auto` under `prefers-reduced-motion: reduce`). With `--reduced-motion no-preference`, hash jumps animate and the next command can observe the heading before it arrives.

`browser open` only accepts a path that starts with a single `/`. It loads that path on the run's `http://127.0.0.1` origin with `waitUntil: load`. It does not follow a meta refresh by itself; Chromium does that after the document loads, so `browser open /writing/` ends on `/#writing`. `fetch` returns the raw response and does not follow a meta refresh or run scripts.

Stable handles on the current pages:

- Banner header. Link `Jarrod Tran` (on the home page its `href` is `#top`). Button `Toggle color theme` with `aria-pressed`. Button `Open menu` / `Close menu` with `aria-expanded` and `aria-controls="mobile-nav"`.
- Navigation `Primary` (desktop) and `Mobile` (phone menu). Primary links: `Writing` (`#writing`), `About` (`#about`), `Experience` (`#experience`), `Work` (`#work`), `Contact` (`#contact`), and `Résumé`.
- Headings: `Jarrod Tran`; `Worth Mulling` (section `#writing`); `About`; `Experience`; `Selected work`; `How I work` (section `#approach`, not in the header); `Looking for product, strategy, or AI roles.`
- Contact `#contact`: link `jarrodtran@outlook.com`, button `Copy email` (later `Copied` or `Couldn't copy`), status text `Email address copied` or `Couldn't copy the email address`, link `Invite me to speak`, link `Résumé`.
- Case study routes: `/work/tesla-energy-ai-product/`, `/work/tesla-energy-portfolio/`, `/work/apple-iphone-india/`, `/work/waymo-engineering-ops/`.

The header switches on its own content box, not on the viewport width. The container query is `@[43rem]` (688px at a 16px root). Horizontal padding is 40px below 640px and 64px from 640px up, and the bar is capped at `max-w-5xl`. Use `1280x800` for the desktop header and `390x844` for the phone menu. At 768px the desktop nav is already showing. At a 32px root font size, 43rem is wider than a 1280px content box, so the phone button shows on a wide viewport.

Viewport screenshots are not full-page. The header is sticky, so the name `Jarrod Tran` stays in the frame. That name is the app identity in a screenshot.

Command catalog (each line is one invocation of `.cursor/skills/verify-site/scripts/verify-site.mjs`):

```text
browser context --color-scheme light --java-script true --viewport 1280x800 --reduced-motion reduce
browser open /
browser click --role button --name "Toggle color theme"
browser press --key Tab
browser text --role heading --name "Worth Mulling"
browser attr --role button --name "Toggle color theme" --attr aria-pressed
browser count --role navigation --name Primary
browser links --within-id writing
browser box --role heading --name "Worth Mulling"
browser wait --role button --name "Copy email" --timeout 4000
browser wait-url "#writing"
browser wait-idle
browser viewport 390x844
browser storage get theme
browser html-class
browser computed
browser clipboard
browser title
browser url
browser active
browser snapshot --role button --name "Toggle color theme" --path .cursor/skills/verify-site/evidence/theme/{run}/toggle.aria.txt
browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/toggle.png
fetch /writing/
```

Add `--within-role navigation --within-name Primary` when the desktop header has the same accessible name as a link in the page, which is the case for `Résumé`. Add `--within-id contact` for the contact `Résumé`. `--nth` is zero-based and is only for a control that has no unique role and name. Prefer a unique name or a within-scope.

`{run}` in a `--path` is replaced with the run id. Relative paths are resolved from the repo root. The helper rejects a path outside `.cursor/skills/verify-site/evidence/` and rejects a path inside the run directory.

`browser storage` has no set command. The theme changes only when the toggle is clicked.

## Evidence

Write proof under `.cursor/skills/verify-site/evidence/<feature-id>/{run}/`. That directory is gitignored. Cleanup does not delete it.

For each step, keep the command and its stdout in `transcript.txt` next to the screenshots. UI proof needs both an ARIA snapshot and a viewport screenshot that shows `Jarrod Tran` in the header. Capture the control before the action and the same control after it, not only the last screen.

Side effects to record beside the pixels:

- Theme: `browser storage get theme` (key `theme`, the next-themes default; `Providers` does not override it) and `browser html-class`.
- Copy email: `browser clipboard` after a context started with `--clipboard`, plus the status text.
- Navigation and case studies: `browser url` after the click.

A journey passes only if those side effects match the feature file. A status string or a screenshot alone does not. Do not call `localStorage.setItem`, do not stub `navigator.clipboard.writeText`, and do not drive through a test-only endpoint. This site has none.

`fetch` shows the response bytes. Use it to prove a meta refresh or a 404 status. Then use `browser open` when the visitor-visible page is the thing under test. Meta refresh and the clipboard are production behavior. Confirm them from the response, the DOM, or the clipboard read. Do not treat the command name as the proof.

Record the feature id, the entry point, and the run id in the transcript. If a precondition is missing, write the command you ran and the unmet condition, and stop that entry point. Do not verify it through a different path and call it passed.

## Cleanup

```bash
.cursor/skills/verify-site/scripts/verify-site.mjs cleanup
```

Cleanup signals the recorded browser-daemon pid, the recorded Chromium pid, and the recorded server pid, in that order. It sends `SIGTERM`, waits, then `SIGKILL` if that pid is still alive. It signals a pid only when `/proc/<pid>/cmdline` matches the process this run started (`verify-site.mjs`, or Chromium). It then deletes `/tmp/verify-site/<id>/` (the run directory) and the `current` pointer if it points at that id. It does not delete `out/`, `.next/`, the evidence directory, or any process it did not record.

A second cleanup prints `verify-site: nothing to clean` and exits 0. Run cleanup after a failed launch or a failed drive too. Launch already tries to stop a server it started when a later step fails. Cleanup is still safe.

Set `VERIFY_SITE_RUN_ID` to clean a run that is not the `current` pointer.

## Helpers

The helper is `.cursor/skills/verify-site/scripts/verify-site.mjs`. It is executable. From the repo root:

```bash
.cursor/skills/verify-site/scripts/verify-site.mjs --help
.cursor/skills/verify-site/scripts/verify-site.mjs launch
.cursor/skills/verify-site/scripts/verify-site.mjs doctor
.cursor/skills/verify-site/scripts/verify-site.mjs browser open /
.cursor/skills/verify-site/scripts/verify-site.mjs cleanup
```

`node .cursor/skills/verify-site/scripts/verify-site.mjs <command>` is the same entry point when the executable bit is missing.

`launch` spawns `verify-site.mjs serve` in its own session and records the pid in the run's `state.json`. The first `browser` command spawns `verify-site.mjs browser-daemon` and records that pid in `browser.json`. This Playwright build's Browser object has no `process()` method, so the Chromium pid is the daemon's child from `/proc/<pid>/task/<pid>/children` whose command line contains `chrome`. Do not start `serve` or `browser-daemon` yourself. Logs are `server.log` and `browser.log` in the run directory.

The server adds `x-verify-site-run` and `cache-control: no-store`. Those headers are not part of `out/`. Doctor uses the run header to prove the port belongs to this process.

## Maintenance

When the site changes, run `/maintain-verification-skill` and update this map from the current pages. Do not keep a journey that no longer matches a control just to make it pass.
