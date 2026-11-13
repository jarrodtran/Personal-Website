# Phone menu

On a narrow header, the desktop links collapse into a button named `Open menu`. Choosing it shows Writing, About, Experience, Work, Contact, and Résumé. Escape closes the menu and puts focus back on that button. Widening the header closes it as well.

## Sub-features

- `menu-open` reveals navigation `Mobile` and changes the button name to `Close menu`.
- `menu-section` follows `Writing` and closes the menu on arrival.
- `menu-escape` closes the menu from the keyboard and restores focus.
- `menu-widen` closes an open menu when the header becomes the desktop bar.

## How to get to it (user POV)

- Narrow the window until the header shows `Open menu` instead of the row of section links. `390x844` at the default font size is that window.
- Choose `Open menu`, then a section or `Résumé`.
- Press Escape while the menu is open.
- Widen the window back to the desktop header while the menu is open.

## Driving it with verify-site

Preconditions:

- Doctor printed `doctor: ok`.
- Start from a fresh context at `390x844`. Do not use `1280x800` for the open step. At 768 CSS pixels and a 16px root, the desktop nav is already visible.

- **Closed.** Run `browser context --color-scheme light --java-script true --viewport 390x844 --reduced-motion reduce`, `browser open /`, and `browser wait-idle`. `browser count --role button --name "Open menu"` prints `1`. `browser count --role navigation --name Primary` prints `0`. `browser attr --role button --name "Open menu" --attr aria-expanded` prints `false`. `browser attr --role button --name "Open menu" --attr aria-controls` prints `mobile-nav`.
- **Open.** Run `browser click --role button --name "Open menu"`. `browser count --role navigation --name "Mobile"` prints `1`. `browser count --role button --name "Close menu"` prints `1`. `browser attr --role button --name "Close menu" --attr aria-expanded` prints `true`. `browser computed` prints `overflow: hidden`. `browser links --within-role navigation --within-name Mobile` lists `Writing`, `About`, `Experience`, `Work`, `Contact`, and `Résumé`.
- **Section.** Run `browser click --role link --name "Writing" --within-role navigation --within-name "Mobile"` and `browser wait-url "#writing"`. `browser count --role navigation --name "Mobile"` prints `0`. The heading `Worth Mulling` is in the viewport (`browser box`, `y` between 0 and 844).
- **Escape.** Open the menu again with `browser click --role button --name "Open menu"`. Run `browser press --key Escape` and `browser wait-idle`. `browser count --role navigation --name "Mobile"` prints `0`. `browser active` reports `ariaLabel: Open menu`. `browser computed` prints `overflow: clip visible`.
- **Widen.** Run `browser click --role button --name "Open menu"` and `browser viewport 1280x800`. Wait until `browser count --role navigation --name "Mobile"` prints `0` and `browser count --role navigation --name "Primary"` prints `1`. `browser computed` prints `overflow: clip visible`. If the menu is still open after the viewport change, stop. Do not close it from the console.
- **Proof.** Re-open the menu at `390x844` (`browser viewport 390x844`, then `browser click --role button --name "Open menu"`). Run `browser screenshot --path .cursor/skills/verify-site/evidence/phone-menu/{run}/open.png` and `browser snapshot --role navigation --name "Mobile" --path .cursor/skills/verify-site/evidence/phone-menu/{run}/open.aria.txt`. The screenshot shows `Jarrod Tran` and the open menu. The snapshot lists the six links.

## Gotchas

- The button's accessible name is `Open menu` when closed and `Close menu` when open. A second click on `Open menu` will not find the button.
- Navigation `Primary` is `display: none` at this width, so a count of `0` is the desktop bar being hidden, not a missing header.
- Escape is handled only while the menu is open. Pressing Escape on the closed page does not prove this feature.
- Focus is moved to the same button node. After React commits the closed state, `browser active` shows `Open menu`. Read it after `browser wait-idle`.
- While the menu is open, `document.body.style.overflow` is `hidden`, so `browser computed` reports `overflow: hidden`. After close, the inline style is removed and the closed page reports `overflow: clip visible` from `overflow-x: clip` on `body`.
- The header listens for `resize` and closes when the menu button's `offsetParent` is null. `browser viewport 1280x800` is the widen step. If Mobile is still present, the journey fails.
- At a 32px root font size, 43rem no longer fits a 1280px content box, so the phone button appears on a wide viewport. This recipe uses the default font size.
- The last link in the menu is `Résumé`. On a short viewport the panel scrolls. This recipe's `390x844` window shows the links without that scroll. A `320x256` window at 200% text is a separate check in `pnpm a11y`, not this journey.
