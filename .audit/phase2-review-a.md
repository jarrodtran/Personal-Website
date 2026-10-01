## Findings

I found no critical issues. Six findings are warnings, and two of those cause real damage: the hero's three-button row squeezes its icons at the most common phone widths, and the new tests turn red (blocking CI and deploy) as soon as someone sets the `calendar` option the README documents. Eight findings are nits.

All five commands pass on `bf14731` (`pnpm test`, `check`, `lint`, `a11y`, `size`). I probed the built `out/` in Chrome 148 with scratch scripts in `/tmp/review-a/`. Several claims hold up there and aren't flagged: no element keeps the 10px offset once scrolled through, reduced motion gets no animations, the photo is lazy (not requested on load), next-themes' script runs before any visible markup, and the title is 54 characters.

### 1. [warning] Hero action row squeezes or drops its icons at 320–360px

**Location**: `components/sections/hero.tsx:5-8`, `:38-60`
**Finding**: `grid grid-cols-3` gives each button a `minmax(0, 1fr)` track, so the buttons can shrink below their content. The icons have no `shrink-0`, so they are the flex items that absorb the shortfall.
**Evidence**: Measured icon widths in Chrome, where each should be 16px:

| Viewport | Résumé | Email | LinkedIn |
| -------- | ------ | ----- | -------- |
| 360px    | 16     | 16    | 11       |
| 340px    | 10.8   | 16    | 4.3      |
| 320px    | 4.1    | 16    | 0 (gone) |

360px is the most common Android width, and 320px covers iPhone SE and "Zoomed" display mode. The old hero stacked its buttons (`flex-col`), so this is new. `pnpm a11y` only checks 390px, so it can't catch it.
**Suggestion**: Let the row wrap (`flex flex-wrap gap-2`) and put `shrink-0` on the icons, or hide the icons below about 380px. `shrink-0` alone isn't enough: at 320px each button needs about 104px and gets 86px.

### 2. [warning] Tests pin today's values, so setting the documented `calendar` option breaks CI and deploy

**Location**: `tests/sections.test.tsx:57-69`, `:108-121`, `:125-135`
**Finding**: The contact test checks for exactly three links, with the email, LinkedIn URL, `/resume.pdf` and filename written out literally. The calendar test mutates the shared `site` object and then `delete`s the property instead of restoring its previous value.
**Evidence**: In a scratch copy where the only change was adding `calendar: "https://cal.com/jarrodtran"`, `vitest run` failed with "expected [ 4 items ] to deeply equal [ 3 items ]". `pnpm test` gates both `ci.yml` and `deploy.yml`, so following the README's instructions blocks deploy. Changing the email or LinkedIn URL has the same effect.
**Suggestion**: Build the expected list from `site.contact`, appending the calendar entry when it is set. For the branch test, pass the data in (`Contact({ contact = site.contact })`) instead of mutating the module.

### 3. [warning] Key claims are checked by grepping source, even though a real-browser check now exists

**Location**: `tests/copy-contract.test.ts:112-119`, `:211-227`, `:39-55`; `scripts/a11y.mjs`
**Finding**: Three intent claims are verified indirectly:

- **Reveal never hides content:** a regex looks for the word "opacity" inside `.reveal {` blocks and for the string `prefers-reduced-motion: no-preference` anywhere in the CSS file.
- **Title length:** the test greps `layout.tsx` for `default: site.positioning.documentTitle` instead of reading the built `<title>`.
- **Positioning copy:** the contract reads every string in `site`, but `valueProp` now renders only in `<head>`.

**Evidence**:

- I appended `@media (prefers-reduced-motion: no-preference) { .reveal:not(:hover) { clip-path: inset(0 0 100% 0) } }`, which hides every revealed block. All 25 tests stayed green. axe skips clipped content, so `pnpm a11y` wouldn't flag it either.
- The body text of `out/index.html` contains neither "corporate operator" nor "product & strategy". The positioning assertion now passes only on `<head>` content.

**Suggestion**: Add real checks to `a11y.mjs`:

- `document.title.length <= 60`.
- With `reducedMotion: "reduce"`, `.reveal` elements have zero `getAnimations()`.
- With motion allowed, scroll to the bottom using `behavior: "instant"` (the page sets `scroll-behavior: smooth`), then assert every `.reveal` has `translate: none` and isn't clipped.

Then delete the CSS regex test.

### 4. [warning] The copy button fails silently, and its reset timer goes stale

**Location**: `components/copy-email.tsx:8-16`
**Finding**: When the copy fails (`writeText` rejects, or `navigator.clipboard` is undefined and throws inside the `try`), the `catch` just sets `copied` to false. Nothing is shown or announced. Each click also starts a new 2s timeout without clearing the previous one.
**Evidence**: With `writeText` stubbed to reject, the button still read "Copy email" after a click and the `role="status"` region stayed empty. Clicking at 0s and again at 1.5s, the label reverted 0.5s after the second click. The commit says the button "announces its result"; only success is announced.
**Suggestion**: Track `"idle" | "copied" | "failed"`. On failure, say so and select the address text. Keep the timeout id in a ref and clear it on each click.

### 5. [warning] The repeated-phrase gate defines "figure" and "word" differently from the rest of the copy rules

**Location**: `tests/copy-contract.test.ts:61-77` vs `content/visitor-copy.ts:94-104`
**Finding**: The other copy rules live in `visitor-copy.ts` (`findBannedFraming`, `extractFigures`), but this rule's algorithm sits inside the test body. It differs from the shared helpers in three ways:

- **"Figure":** it exempts any window matching `/\d/`, while `extractFigures` says "0→1 is a phrase, not a figure". So repeats containing "0→1", "Model 3" or "4680" slip through.
- **"Word":** the tokenizer drops `.`, `'`, `’` and `&`. "I'm" becomes two tokens and "$1.6M" becomes `$1`and`6m`, so many "five-word" windows are four words. Failure messages print fragments like `i m open to growth-stage`.
- **String boundaries:** it rebuilds per-string boundaries by splitting a `join("\n")` blob.

**Evidence**: Tokenizer output on the real content confirms the splits. `POSITIONING.md` now points copy editors at this rule, but its definition lives only in the test.
**Suggestion**: Export `getVisitorFacingStrings(): string[]` and `findRepeatedPhrases(strings, n = 5)` from `visitor-copy.ts`, exempting windows where `extractFigures(window).length > 0`. The test then becomes a single `toEqual([])`.

### 6. [warning] The client `Nav` ships the whole content module, including internal copy (pre-existing, but this PR edits that import)

**Location**: `components/nav.tsx:1`, `:5`
**Finding**: `"use client"` plus `import { site }` pulls all of `content/site.ts` into public JS. That includes `outreach` (whose comment says it is "Not rendered on the public site"), `headlineVariants`, `audiences` and `contact.phone`.
**Evidence**: `out/_next/static/chunks/3z_5k0m22j3m-.js` (21.9 kB) contains "Happy to compare notes", "I walk into chaos" and "(607) 760-2068". About 12 kB of that chunk is the content literal. The test "keeps paste-ready outreach off the public page" only greps `hero.tsx` and `page.tsx`. This PR measures JS savings and adds `site.contact.resumeFilename` to exactly this import.
**Suggestion**: `Nav` only needs `site.nav`, the name, and the résumé href and filename. Pass those as props from the server `layout.tsx`, or import them from a small `content/nav.ts`.

### 7. [nit] The targeting line lives under `positioning` but only renders in the contact heading

**Location**: `content/site.ts:47`, `:80`, `:117`; `components/sections/contact.tsx:34`
**Finding**: `sections.contact` was narrowed to `Omit<SectionCopy, "description">`, and the component then supplies `description={site.positioning.targetingLine}` from another part of the content model. That string now has exactly one consumer.
**Suggestion**: Move it to `sections.contact.description` and delete the field and the `Omit`.

### 8. [nit] The résumé link is assembled in four places

**Location**: `nav.tsx:90-96`, `:135-142`; `hero.tsx:39-46`; `contact.tsx:53-57`
**Finding**: Each place repeats `href={…resumeHref} download={…resumeFilename}`, with two different labels. They match only by convention; the bare `download` bug this PR fixed existed because of that duplication.
**Suggestion**: Add a `ResumeLink` component.

### 9. [nit] The photo is "correctly sized" only at 1024px and wider

**Location**: `components/sections/about.tsx:41-50`
**Evidence**:

- At 1280px and 2x density, the photo renders 382 CSS px wide (764 device px), so 800px fits.
- At 820px and 2x, it needs 1508 device px.
- At 1000px, it renders 934×1168 CSS px, which is 1.46 viewport heights tall and upscaled from 800px.

**Suggestion**: Cap the column width below `lg` (for example `max-w-sm`, then `lg:max-w-none`).

### 10. [nit] Two assertions test history rather than behaviour

**Location**: `copy-contract.test.ts:223-226`
**Finding**: They assert that `components/reveal.tsx` doesn't exist and that `motion` isn't a dependency. A future `reveal.tsx` that just applies the CSS class would fail for no behavioural reason. Finding 3's browser checks would replace them.

### 11. [nit] `documentTitle` comment and duplication

**Location**: `content/site.ts:44`, `:114`
**Finding**: The comment says "under 60" while the test and README allow 60. The literal also re-types `name` (hence the `startsWith(name)` assertion) and the employer list that already appears in `footer.tsx` and `sections.experience.description`.

### 12. [nit] `pnpm size` has no consumer

**Location**: `scripts/js-size.mjs`
**Finding**: It isn't in the stated intent, isn't run in CI, and has no budget; it just prints a number. Either fail CI above a threshold or drop it. Separately, the MIME table in `a11y.mjs` still lists `.jpg`.

### 13. [nit] Opening the menu and then widening past `md` locks scrolling (pre-existing, in the effect this PR rewrote)

**Location**: `nav.tsx:44-57`
**Evidence**: Open the menu at 390px and resize to 1280px. `body.style.overflow` stays `"hidden"`, `#mobile-nav` stays mounted but hidden, and the toggle is hidden too. Rotating an iPad mini from portrait (744px) to landscape (1133px) does this. Only Escape or a reload recovers.
**Suggestion**: In the same effect, close the menu when `matchMedia("(min-width: 48rem)")` changes.

### 14. [nit] Grammar in the featured case study

**Location**: `content/site.ts:284-285`
**Finding**: "A modeled ~540 hours reclaimed per week…" pairs a singular article with a plural noun. "Modeled at ~540 hours reclaimed per week and $1.6M…" keeps the same figures, so the ledger still passes.
