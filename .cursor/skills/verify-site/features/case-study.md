# Case study

Selected work on the home page opens a case study. The page shows the work's title, the panel figure, Context, Constraints, Decisions, Outcome, and My role, then a next case study and a way back to the list.

## Sub-features

- `case-open` opens a case study from its card on `#work` and from its `/work/<slug>/` URL.
- `case-sections` shows the five section headings and the panel figure.
- `case-next` opens the next case study. The last one wraps to the first.
- `case-back` returns to `/#work` from `Back to selected work` and from the `Selected work` breadcrumb.
- `case-external` exposes the off-site link that belongs to that study. The on-site proof reads `href` and does not leave the origin.

## How to get to it (user POV)

- From Selected work, choose `Tesla Energy: AI product that got used`, `Tesla Energy: which dollar moves the P&L`, `Apple: 0→1 iPhone India`, or `Waymo: one plan, six functions`.
- Open `/work/tesla-energy-ai-product/`, `/work/tesla-energy-portfolio/`, `/work/apple-iphone-india/`, or `/work/waymo-engineering-ops/` directly.
- Choose the `Next:` link at the top of a study.
- Choose `Selected work` or `Back to selected work`.
- Choose the external link on the study (`Tesla Energy`, `Tesla Megapack`, `Apple India`, or `Waymo`).

## Driving it with verify-site

Preconditions:

- Doctor printed `doctor: ok`.
- Use the desktop context. The card title is a link on both widths.

- **Open the featured card.** Run `browser context --color-scheme light --java-script true --viewport 1280x800 --reduced-motion reduce`, `browser open /#work`, and `browser click --role link --name "Tesla Energy: AI product that got used"`. Run `browser wait-url "/work/tesla-energy-ai-product/"`. `browser title` prints `Tesla Energy: AI product that got used · Jarrod Tran`. `browser text --role heading --name "Tesla Energy: AI product that got used"` prints `Tesla Energy: AI product that got used`.
- **Sections.** `browser text --role heading --name "Context"` prints `Context`. The same command for `Constraints`, `Decisions`, `Outcome`, and `My role` prints those labels. Run `browser snapshot --path .cursor/skills/verify-site/evidence/case-study/{run}/featured.aria.txt`. The snapshot includes `1,000+` and `Back to selected work`.
- **External link.** Run `browser attr --role link --name "Tesla Energy" --attr href`. The value is `https://www.tesla.com/energy`. Do not click it for this entry point.
- **Next.** Run `browser click --role link --name "Next: Tesla Energy: which dollar moves the P&L"` and `browser wait-url "/work/tesla-energy-portfolio/"`. `browser title` prints `Tesla Energy: which dollar moves the P&L · Jarrod Tran`. `browser attr --role link --name "Tesla Megapack" --attr href` prints `https://www.tesla.com/megapack`.
- **Next again.** Run `browser click --role link --name "Next: Apple: 0→1 iPhone India"` and `browser wait-url "/work/apple-iphone-india/"`. The title is `Apple: 0→1 iPhone India · Jarrod Tran`. `browser attr --role link --name "Apple India" --attr href` prints `https://www.apple.com/in/`.
- **Next again.** Run `browser click --role link --name "Next: Waymo: one plan, six functions"` and `browser wait-url "/work/waymo-engineering-ops/"`. The title is `Waymo: one plan, six functions · Jarrod Tran`. `browser attr --role link --name "Waymo" --attr href` prints `https://waymo.com/`.
- **Wrap.** Run `browser click --role link --name "Next: Tesla Energy: AI product that got used"` and `browser wait-url "/work/tesla-energy-ai-product/"`. The title is the featured title again.
- **Direct URL.** Run `browser open /work/waymo-engineering-ops/`. The title is `Waymo: one plan, six functions · Jarrod Tran`. Repeat open for `/work/apple-iphone-india/` and `/work/tesla-energy-portfolio/` and require each title above.
- **Back.** From the featured study, run `browser click --role link --name "Back to selected work"` and `browser wait-url "/#work"`. The heading `Selected work` is in the viewport. Open the featured study again and run `browser click --role link --name "Selected work"` and `browser wait-url "/#work"`.
- **Proof.** On the featured study, run `browser screenshot --path .cursor/skills/verify-site/evidence/case-study/{run}/featured.png`. The screenshot shows `Jarrod Tran` and the study title.

## Gotchas

- The card title and the case-study `h1` share an accessible name. `browser wait --role heading --name "Tesla Energy: AI product that got used"` succeeds on the home page before navigation. Wait for the URL.
- `Next:` links include the next title, so a body search for the featured title also matches the Waymo page's next link. Use `browser title` or the URL, not a substring of the body.
- The four external hrefs are `https://www.tesla.com/energy`, `https://www.tesla.com/megapack`, `https://www.apple.com/in/`, and `https://waymo.com/`. Clicking one leaves the verification origin. Read `href` for the on-site entry point. If you do click it, later steps fail until `browser open` returns to the study.
- `/work/` is the legacy refresh to `/#work`, not a case study index. Opening it does not prove a study.
- The breadcrumb link is named `Selected work`. The return link is named `Back to selected work`. They are different controls.
- Figures on the page are the ones already in the export. Do not add or rewrite them during the drive.
