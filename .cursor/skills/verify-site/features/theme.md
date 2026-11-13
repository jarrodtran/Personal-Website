# Theme

The theme control switches the site between light and dark. With no saved choice, the page follows the system color scheme. The choice is kept in the browser and used again after a reload. With JavaScript disabled, the same palette still paints from the system scheme.

## Sub-features

- `theme-system-light` follows a light system scheme: the toggle is not pressed, and `html` includes the class token `light`.
- `theme-toggle-dark` switches that page to dark and stores the choice.
- `theme-persist` shows the stored dark choice again after a reload in the same browser context.
- `theme-system-dark` follows a dark system scheme on a fresh context: the toggle is pressed, and `html` includes the class token `dark`.
- `theme-toggle-light` switches that page to light and stores the choice.
- `theme-no-js-dark` paints the dark palette when JavaScript is off and the system scheme is dark, without a `dark` class token.
- `theme-no-js-light` paints the light palette when JavaScript is off and the system scheme is light.

## How to get to it (user POV)

- Load any page and use the header button named `Toggle color theme`. The home page is the entry point below.
- Leave the choice unset and change the operating system color scheme. The page follows it on the next load.
- Reload the page after a click. The last click wins over the system scheme.
- Disable JavaScript and reload. The palette still follows the system scheme.

## Driving it with verify-site

Preconditions:

- Doctor printed `doctor: ok` for this run.
- Evidence directory: `.cursor/skills/verify-site/evidence/theme/{run}/`.
- Each `browser context` below starts from empty `localStorage`.

- **System light.** Open a light context and wait until the toggle has hydrated. Run `browser context --color-scheme light --java-script true --viewport 1280x800 --reduced-motion reduce`, `browser open /`, and `browser wait-idle`. `browser attr --role button --name "Toggle color theme" --attr aria-pressed` prints `false`. `browser html-class` includes the token `light` and does not include the token `dark`. `browser storage get theme` prints `null`. `browser title` prints `Jarrod Tran · Product & strategy · Tesla, Apple, Waymo`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/system-light.png` and `browser snapshot --role button --name "Toggle color theme" --path .cursor/skills/verify-site/evidence/theme/{run}/system-light.aria.txt`. The screenshot shows the header name `Jarrod Tran` on a light page. The snapshot line is `- button "Toggle color theme"` with no `[pressed]`.
- **Toggle to dark.** Choose the toggle. Run `browser click --role button --name "Toggle color theme"` and `browser wait-idle`. `aria-pressed` is `true`. `browser html-class` includes `dark` and does not include `light`. `browser storage get theme` prints `dark`. `browser computed` prints `background: rgb(10, 10, 10)` and `color: rgb(242, 242, 242)`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/dark-after-click.png` and `browser snapshot --role button --name "Toggle color theme" --path .cursor/skills/verify-site/evidence/theme/{run}/dark-after-click.aria.txt`. The snapshot line is `- button "Toggle color theme" [pressed]`.
- **Persist.** Reload the home page in this same context. Run `browser open /` and `browser wait-idle`. `aria-pressed` stays `true`, `browser storage get theme` stays `dark`, and `html` still has the token `dark`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/dark-after-reload.png` and `browser snapshot --role button --name "Toggle color theme" --path .cursor/skills/verify-site/evidence/theme/{run}/dark-after-reload.aria.txt`.
- **System dark.** Start a fresh dark context. Run `browser context --color-scheme dark --java-script true --viewport 1280x800 --reduced-motion reduce`, `browser open /`, and `browser wait-idle`. `aria-pressed` is `true`. `html` includes `dark`. `browser storage get theme` prints `null`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/system-dark.png` and `browser snapshot --role button --name "Toggle color theme" --path .cursor/skills/verify-site/evidence/theme/{run}/system-dark.aria.txt`.
- **Toggle to light.** Choose the toggle again. Run `browser click --role button --name "Toggle color theme"` and `browser wait-idle`. `aria-pressed` is `false`. `browser storage get theme` prints `light`. `html` includes `light` and does not include `dark`. `browser computed` prints `background: rgb(255, 255, 255)` and `color: rgb(17, 17, 17)`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/toggled-to-light.png` and `browser snapshot --role button --name "Toggle color theme" --path .cursor/skills/verify-site/evidence/theme/{run}/toggled-to-light.aria.txt`.
- **No JavaScript, dark scheme.** Run `browser context --color-scheme dark --java-script false --viewport 1280x800 --reduced-motion reduce` and `browser open /`. `browser computed` prints `background: rgb(10, 10, 10)` and `color: rgb(242, 242, 242)`. The `htmlClass` tokens do not include `dark` or `light`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/no-js-dark.png`.
- **No JavaScript, light scheme.** Run `browser context --color-scheme light --java-script false --viewport 1280x800 --reduced-motion reduce` and `browser open /`. `browser computed` prints `background: rgb(255, 255, 255)` and `color: rgb(17, 17, 17)`. Run `browser screenshot --path .cursor/skills/verify-site/evidence/theme/{run}/no-js-light.png`.

## Gotchas

- The server HTML renders `aria-pressed="false"` before hydration. Wait for `browser wait-idle` before reading it. The dark palette can already be visible from CSS while the button still says false.
- `Providers` sets `attribute="class"`, `defaultTheme="system"`, and `enableSystem`. It does not set `storageKey`, so next-themes uses `theme`. A system choice leaves the key unset (`null`). The class token is the resolved `light` or `dark`, never `system`.
- The click calls `setTheme` with the opposite explicit theme. It does not return the page to `system`.
- A new `browser context` drops the stored choice. Persistence is a reload with `browser open /` in the same context.
- `html` also carries the font variable classes from the root layout. Match the `light` or `dark` token. Do not require the whole class string to equal that token.
- With JavaScript disabled, the inline theme script does not run, so `html` gets neither theme class. Dark paint comes from `@media (prefers-color-scheme: dark)` on `html:not(.light)`. Assert computed body colors, not `aria-pressed`. The sun and moon icons still follow the `.dark` class (`hidden` / `dark:block` and `dark:hidden` in `components/theme-toggle.tsx`), so a dark no-JS page can show the moon icon. The palette, not the icon, is the proof.
- Do not prove this journey on `pnpm dev`. The visitor artifact is the static export.
