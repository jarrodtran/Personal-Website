# Public site verification map

This directory is the maintained source for verifying the visitor-facing behavior of jarrodtran.com. Read this index, then drive the matching feature file. The helper and the launch rules live in `../SKILL.md`.

## Baseline preconditions

- Run commands from the repo root with `.cursor/skills/verify-site/scripts/verify-site.mjs`.
- Launch prints `verify-site: ready http://127.0.0.1:<port> run=<id>` and `doctor: ok` before any browser command.
- The export uses an empty `BASE_PATH`. Doctor fails if the home page contains `/Personal-Website/_next`.
- The browser profile starts empty. `browser context` drops `localStorage` and cookies for this origin.
- Keep the same `TMPDIR` from launch through cleanup. On this Linux checkout with `TMPDIR` unset, the run directory is `/tmp/verify-site/<id>/`.
- Do not drive a `next dev` server, a port you did not get from this launch, or `https://jarrodtran.com`.
- Two static servers can serve the same `out/` on different ports after their builds have finished. Do not overlap two `pnpm build` runs. Do not reuse a run id that is still alive.

## Driving conventions

- Start every recipe from the baseline state unless its preconditions say otherwise.
- Prefer the helper's `--role` and `--name` flags. Names are exact accessible names.
- Treat every command as literal. Keep the accents in `Résumé` and the period in `Looking for product, strategy, or AI roles.`
- `{run}` in a `--path` is replaced with the run id. Also append the command and its stdout to `transcript.txt` in that evidence directory.
- A new `browser context` is required whenever the recipe needs a fresh `theme` value in `localStorage`.
- The default context is light, JavaScript on, `1280x800`, reduced motion `reduce`, clipboard off.
- Restore nothing in `out/`. The site has no per-run database. Do not delete proof files during cleanup.

## Proof and skip reporting

- Capture the action and the resulting state, not only the final screen.
- UI proof includes an ARIA snapshot and a viewport screenshot that shows the header name `Jarrod Tran`.
- Record `browser url` after a navigation and the side effect the feature names (`localStorage` key `theme`, clipboard text, or response status).
- Record the feature id, the entry point, and the run id with the artifacts.
- Report an unreachable path with the command you ran and the unmet precondition. Doctor's `writing: empty` line means a journey that requires a post is unmet.
- Do not report a skipped entry point as verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph of visitor-visible behavior, then exactly these H2 sections:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with verify-site`
4. `Gotchas`

## Features

- [Theme](./theme.md) covers system light, system dark, the toggle, reload persistence, and paint with JavaScript disabled.
- [Home sections](./home-sections.md) covers the header, primary nav, Writing's baked state, How I work, and the skip link.
- [Phone menu](./phone-menu.md) covers opening the menu, moving to a section, Escape, and widening back to the desktop header.
- [Case study](./case-study.md) covers opening a selected-work page, its sections, the next case study, and the return to `#work`.
- [Copy email](./copy-email.md) covers a successful copy, the denied-permission announcement, and the contact links around that button.

## Also on the site

These routes are real and are not feature files yet. Observe them with `fetch` (raw bytes, no script, no meta refresh) or `browser open` (Chromium follows a meta refresh).

- `/writing/` contains `url=/#writing` and the link `Go to Writing`. `browser open /writing/` lands on `/#writing`.
- `/work/` contains `url=/#work` and the link `Go to Work`. `browser open /work/` lands on `/#work`. Case studies are not this route. They stay at `/work/<slug>/`.
- An unknown path such as `/no-such-page/` returns status 404 and the page whose title is `Page not found · Jarrod Tran`. The heading is `This page doesn’t exist.` The link is `Go home`. Requesting the file `/404.html` itself returns 200 because that file exists.
- `/resume.pdf` is the résumé file. The header and the contact section link to it with download name `Jarrod-Tran-Resume.pdf`.
