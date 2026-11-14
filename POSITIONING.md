# jarrodtran.com

Jarrod Tran’s personal site serves two readers: people who read Worth Mulling, his Substack, and people deciding whether to hire him. The hero states plainly what he does, with one figure, and offers the latest essay or selected work plus the résumé. The homepage leads with selected work, each case study carrying its headline figure, until the first essay exists. Once there is one, the order flips and the latest essays come before the work. Subscribe appears once on the homepage, in the Writing section. About and contact are one section: a short bio, a one-line career path, email, LinkedIn and the résumé. /writing/ is the full essay archive.

Use one public narrative. Keep the prose personal and specific. Work examples should explain the decision Jarrod owned, how he made it, and what happened. Keep employers, dates, and official titles factual. The current role is Lead, AI Enablement & Factory Strategy. Use the official title as written and avoid factory and heavy operational framing elsewhere in visitor copy.

## Publishing

The homepage reads the Substack feed when the static site builds. After publishing on Substack, run the GitHub Pages deployment workflow to refresh the site. The homepage shows the three newest posts, with an All essays link once there are more. /writing/ lists every post, stays noindex until the first one, and joins the sitemap after that. When the feed is empty or fails to load, visitors see the same coming-soon line and can subscribe. The build tries the live feed first, with one retry, then falls back to the committed snapshot at content/writing-feed.xml. After publishing, run `pnpm sync:writing` to refresh that snapshot and commit it, so the site still shows your essays if Substack blocks the GitHub Actions request. The deploy log prints a `::warning::` when the live feed failed, and the build fails if the feed has posts but the homepage lists none.

The résumé is in the nav, About, and the footer. Each figure used in the site’s case studies must appear in the committed résumé or have a recorded source in the metric ledger. The current PDF SHA-256 is `423866775ec6d842c28ba4e23635c6aa0424eff948441528c730a925c18d280b`. Update the PDF, this hash, and its test assertion together.

## Design

Keep the monochrome palette, Newsreader and IBM Plex Sans, and one readable prose column. Keep controls reachable by keyboard and touch, including at narrow widths and doubled text size. The four case-study URLs, the /writing/ archive, and the legacy /work/ redirect remain part of the public site.
