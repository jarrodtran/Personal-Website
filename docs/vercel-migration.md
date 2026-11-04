# Moving hosting to Vercel (proposal, Nov 4, 2026)

Status: proposed, not approved. This PR only adds `vercel.json` (inert while
the site deploys to GitHub Pages) and this runbook. No DNS, domain, or
GitHub Pages setting changes here. Those are owner actions at cutover,
per AGENTS.md.

## Why move

1. **Preview deploys for every PR.** This repo runs a multi-agent review
   workflow (Cursor, Codex, GrokBot, Muse) and docs/review-pass.md asks
   for Preview QA, but the GitHub Pages flow deploys no preview at all:
   reviewers judge screenshots and test output instead of the real page.
   Vercel gives each PR a live URL. This is the main win.
2. **Real response headers.** GitHub Pages cannot set cache or security
   headers. vercel.json adds immutable caching for hashed static assets
   plus nosniff, referrer, framing, and permissions headers.
3. **Analytics becomes a one-line decision.** docs/analytics.md holds
   analytics until one option is chosen on purpose. Vercel Web Analytics
   is first-party, cookieless, and fits the hold criteria if the owner
   picks it. Moving hosts does not choose it; it removes the plumbing
   excuse.
4. **No more Pages workarounds.** scripts/postbuild.mjs exists to patch
   icon and OG hrefs for Pages hosting, and CI runs a second prefixed
   build as a check. Both get simpler once one host serves the root.

## What does not change

- The site stays a static export (`output: "export"`). No server code, no
  runtime cost beyond static hosting, no framework change.
- BASE_PATH stays empty in production (rule:live-site-base-path).
  trailingSlash stays true; vercel.json mirrors it.
- Content, design tokens, and the test suite are untouched by a host move.

## Cutover runbook (owner runs this, in order)

1. Import jarrodtran/Personal-Website into Vercel under the owner's
   account. Framework preset: Next.js. Build settings stay default;
   Vercel reads output export from next.config.ts.
2. Confirm the generated *.vercel.app deployment renders the home page
   and all four /work/ case studies, and that /resume.pdf downloads.
3. Run one trial PR and confirm a preview URL appears and passes the
   same checks reviewers use today.
4. Add the custom domain jarrodtran.com in Vercel, then update DNS at the
   registrar to the values Vercel shows. This step is the point of no
   return; do it in a low-traffic window and keep the Pages deployment
   live until DNS propagates.
5. Verify https://jarrodtran.com serves the Vercel build (response header
   `x-vercel-id` present), the OG image resolves, and the resume link
   works.
6. Follow-up PR (separate, after cutover is verified): remove the GitHub
   Pages deploy workflow, retire the postbuild icon patching if it is no
   longer needed, and update README hosting notes.

## Rollback

DNS back to GitHub Pages values. The Pages workflow stays in place until
step 6, so rollback is a DNS change only, valid until that follow-up PR
merges.

## Risks and honest costs

- One more vendor account and one more dashboard in the owner's life.
- Vercel free tier covers a static personal site comfortably; bandwidth
  overages are a paid-tier conversation only at real traffic.
- Preview URLs are public by default. Fine for this site (the source is
  already public), worth stating once.
