# Home sections

The home page opens on Jarrod Tran's name, then Writing, About, Experience, Selected work, How I work, and the contact section. The header jumps to Writing, About, Experience, Work, and Contact. How I work is on the page and is not in the header.

## Sub-features

- `home-open` shows the document title, the `Jarrod Tran` heading, and the Houston footer line.
- `home-skip` moves the first Tab stop to `Skip to content`.
- `home-primary` jumps from the desktop header to each linked section.
- `home-top` returns to the top from the header name.
- `writing-posts` lists up to five Substack posts when the build fetched the feed.
- `writing-empty` shows the empty sentence and the subscribe link when the build has no posts.
- `home-approach` reaches How I work through the `#approach` fragment. The header has no item for it.

## How to get to it (user POV)

- Open `/`.
- Tab once to `Skip to content`.
- Choose `Writing`, `About`, `Experience`, `Work`, or `Contact` in the header navigation named `Primary`.
- Choose the header name `Jarrod Tran` to return to `#top`.
- Scroll to `How I work`, or open `/#approach`. There is no header link for that section.
- Choose a post title or `Subscribe on Substack` in Writing. Both leave this origin for the host of `site.substack.url`.

## Driving it with verify-site

Preconditions:

- Doctor printed `doctor: ok`.
- Viewport `1280x800` so the header content box is wide enough for navigation `Primary`. At `390x844` that navigation is not visible. Use the phone menu feature there.
- Read doctor's `writing:` line before the Writing steps. Drive only the state it names.

- **Open home.** Run `browser context --color-scheme light --java-script true --viewport 1280x800 --reduced-motion reduce`, `browser open /`, and `browser wait-idle`. `browser title` prints `Jarrod Tran · Product & strategy · Tesla, Apple, Waymo`. `browser text --role heading --name "Jarrod Tran"` prints `Jarrod Tran`. `browser text --role contentinfo` includes `Houston, TX`. The year is the year of the build machine. Do not require a specific year.
- **Skip link.** Run `browser press --key Tab` and `browser active`. `text` is `Skip to content`. If it is not, stop this entry point.
- **Writing.** Run `browser click --role link --name "Writing" --within-role navigation --within-name Primary` and `browser wait-url "#writing"`. `browser text --role heading --name "Worth Mulling"` prints `Worth Mulling`. `browser box --role heading --name "Worth Mulling"` has `y` greater than or equal to 0 and less than 800.
- **Posts or empty.** Run `browser links --within-id writing` and `browser attr --role link --name "Subscribe on Substack" --attr href`. The subscribe href is `site.substack.url` with any trailing slash removed (`writingSubscribeUrl` in `lib/writing.ts`). Read that string from `content/site.ts` before comparing. If doctor printed `writing: posts`, the link list also has at least one other href on that same host whose accessible name ends with `(opens Substack)`, and `fetch /` does not contain `First post coming soon. Subscribe to get it by email.` If doctor printed `writing: empty`, the link list is only the subscribe href, and `fetch /` contains that sentence. Do not drive the other Writing state. If doctor printed `writing: unknown`, stop and record that line. Run `browser screenshot --path .cursor/skills/verify-site/evidence/home-sections/{run}/writing.png` while `#writing` is in view.
- **About.** Run `browser click --role link --name "About" --within-role navigation --within-name Primary` and `browser wait-url "#about"`. The heading `About` is in the viewport (`browser box --role heading --name "About"`).
- **Experience.** Run `browser click --role link --name "Experience" --within-role navigation --within-name Primary` and `browser wait-url "#experience"`. The heading `Experience` is in the viewport. The heading `Tesla` is present (`browser text --role heading --name "Tesla"`).
- **Work.** Run `browser click --role link --name "Work" --within-role navigation --within-name Primary` and `browser wait-url "#work"`. The heading `Selected work` is in the viewport.
- **Contact.** Run `browser click --role link --name "Contact" --within-role navigation --within-name Primary` and `browser wait-url "#contact"`. The heading `Looking for product, strategy, or AI roles.` is in the viewport.
- **Top.** Run `browser click --role link --name "Jarrod Tran"` and `browser wait-url "#top"`. The heading `Jarrod Tran` has `y` greater than or equal to 0 and less than 800.
- **How I work.** Run `browser open /#approach`. The URL contains `#approach`. The heading `How I work` is in the viewport. `browser count --role link --name "How I work" --within-role navigation --within-name Primary` prints `0`.
- **Proof.** Run `browser screenshot --path .cursor/skills/verify-site/evidence/home-sections/{run}/approach.png` and `browser snapshot --role navigation --name "Primary" --path .cursor/skills/verify-site/evidence/home-sections/{run}/primary.aria.txt`. The screenshot shows `Jarrod Tran`. The snapshot lists `Writing`, `About`, `Experience`, `Work`, `Contact`, and `Résumé`.

## Gotchas

- The visible Writing heading is `Worth Mulling`, not `Writing`. `Writing` is the header link.
- `aria-current="location"` is set by an `IntersectionObserver` on the desktop links only. It can lag the hash or land on a neighboring section. The pass is the URL hash and the heading box, not `aria-current`.
- The header and the contact section both expose a link named `Résumé`. Scope the header one with `--within-role navigation --within-name Primary`.
- Post links include the screen-reader text `(opens Substack)`, so the accessible name is longer than the visible title. Subscribe does not include that suffix.
- Clicking a post or `Subscribe on Substack` leaves `127.0.0.1`. Read `href` for the on-site proof. A click is a separate entry point and later on-site assertions fail until `browser open /`.
- How I work's id is `approach`. Searching the header for that name and then clicking Work is not a pass for this section.
- Smooth scrolling is disabled in the default reduced-motion context. If you switch to `--reduced-motion no-preference`, wait until the heading box is inside the viewport.
- The home page does not render `site.positioning.headline`. Do not wait for that string in the document body.
