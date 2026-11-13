---
name: verify-site
description: Verify the jarrodtran.com static export with the repository's automated checks and targeted browser evidence. Use for changes to the homepage, writing, navigation, theme, case studies, résumé, or contact.
---

# Verify the public site

Run from the repository root. The deployed artifact is `out/`, served at the site root. The default PR check also builds a project-prefixed export. Browser evidence for production should use the root export.

1. Install dependencies with `pnpm install --frozen-lockfile` and the browser with `pnpm exec playwright install chromium` if needed.
2. Run `pnpm verify`. It builds the production export, checks that no fixture posts were shipped, and runs the repository's export and browser checks. When testing a narrower change, build with `BASE_PATH="" pnpm build` and run the relevant `pnpm test:*` command. Clear `WRITING_FEED_PATH` and `WRITING_FIXTURE_EXPORT` first. Avoid building while another verification process is reading `out/`.
3. For visual review, run `python3 -m http.server 4173 --bind 127.0.0.1 --directory out` in a separate terminal. Use another port if 4173 is occupied. The Python server's unknown-path response is generic. Review the exported error design at `/404.html`.
4. Follow the relevant journeys in [references/journeys.md](references/journeys.md). Stop the server you started once the review is done.

Use the browser and built output to verify changes. Record the commit SHA, theme, viewport, text scale, route, and actual result. Screenshots support design findings. Capture behavior evidence such as destination URLs, focused controls, or clipboard contents for interaction findings. Save working screenshots outside the checkout.

For PRs, follow the current review requirements in [AGENTS.md](../../../AGENTS.md) and use [docs/review-pass.md](../../../docs/review-pass.md) to record findings.
