No critical issues. I found five warnings and five nits. All five checks I was allowed to run pass on `bf14731`: 25/25 tests, `tsc`, `eslint`, the axe and phone-menu check, and `pnpm size` (489 kB raw JS). The axe run reports no "incomplete" results either. I confirmed several claims in Chrome against the built `out/`:

- The reveal animation never hides content.
- Under reduced motion nothing animates.
- The dark run really applies `.dark`.
- The page title is 54 characters.
- The photo is a lazy-loaded 800×1000 webp.

The problems are below.

## Findings

### 1. [warning] The phone menu stays "open" past the `md` breakpoint, so the page can't scroll

**Location**: `components/nav.tsx:44-57` (the rewritten effect), `:100` and `:119` (`md:hidden`)
**Finding**: The effect this PR rewrote ties the body scroll lock and the document-level Escape listener to `open`. Nothing resets `open` when the viewport crosses `md`. At that point CSS hides both the toggle and the panel, so the user has no way to close the menu, and `body.style.overflow` stays `hidden`.
**Evidence**: Steps in Chrome:

- Open the menu at 390×844.
- Resize to 932×430 (phone landscape).
- Result: `body.style.overflow === "hidden"`, the toggle isn't visible, and `#mobile-nav` is in the DOM but invisible.
- A 1500px mouse-wheel scroll leaves `scrollY` at 0.

In that state, Escape calls `focus()` on a `display:none` button, which does nothing. The same bug exists on `main`. But this PR rewrote exactly this dismissal effect, and the commit says the effect "still owns the body scroll lock".
**Suggestion**: In the same effect, call `setOpen(false)` when `matchMedia("(min-width: 48rem)")` starts matching. Add this case to the phone-menu check in `scripts/a11y.mjs`.

### 2. [warning] The section tests pin today's data, so turning on the documented `calendar` option fails `pnpm test` and blocks deploy

**Location**: `tests/sections.test.tsx:56-70`, `:107-123`, `:125-135`; `README.md:16`
**Finding**: The contact test uses `toEqual` against exactly three hard-coded link objects. The calendar test sets a property on the shared `site` module object, then `delete`s `site.contact.calendar` in `finally`.
**Evidence**: In a scratch copy, I added `calendar: "https://cal.com/jarrodtran"` to `site.contact`, which is the switch README line 16 documents. The test "offers email with a copy button, LinkedIn, and the résumé, and no form" then fails because a fourth link, "Book a call", appears. CI and deploy both run `pnpm test`, so enabling a documented feature blocks the deploy.

The `finally { delete … }` assumes the key was unset. It would also erase a real configured value for any later test in the file. The hero and experience tests hard-code values the same way: the email address, the hrefs, `["Tesla","Waymo","Apple"]` and the "Rejoined in 2023…" note. The next job change will break them even though the components behave correctly.
**Suggestion**: Build expected values from `site.contact` and `site.experience`. Assert the calendar row exists exactly when `Boolean(site.contact.calendar)`. For the positive case, pass an overridden contact object in, or use `vi.spyOn`, instead of mutating the module singleton.

### 3. [warning] The copy button fails silently; its status region only ever reports success

**Location**: `components/copy-email.tsx:8-16`, `:25-29`
**Finding**: If `writeText` rejects or `navigator.clipboard` is undefined, the `catch` sets `copied` to `false`, which it already was. Nothing visible changes and nothing is announced. Commit `ac09df2` says the button "announces its result through a status region", but a failed copy is never announced.

The 2-second reset timer is also never cleared. If you click twice within 2 seconds, the first timer clears "Copied" early.
**Evidence**: The status span renders `copied ? "Email address copied" : ""`, and the `catch` path leaves it at `""`. Clipboard writes fail in several real situations:

- Plain-HTTP pages. The README says "Enforce HTTPS" on the domain is still pending.
- In-app browsers that deny clipboard permission, which is where recruiters often open links.
- Pages under a restrictive permissions policy.

A user who sees no feedback may assume the copy worked and paste whatever was on their clipboard before.
**Suggestion**: Use an `"idle" | "copied" | "failed"` state, and on failure show and announce "Couldn't copy, select the address instead". Keep the timer in a ref and clear it before setting a new one.

### 4. [warning] The Contact subtitle is read from `positioning.targetingLine`, and a type was narrowed to make that work

**Location**: `components/sections/contact.tsx:34`; `content/site.ts:47`, `:80`, `:117`; `README.md:15`
**Finding**: The hero no longer renders `targetingLine`, so the Contact subtitle is its only consumer. The PR did not move the sentence into `sections.contact.description`. Instead it:

- deleted that field,
- narrowed the type to `Omit<SectionCopy, "description">`,
- and had the Contact section read from `positioning`.
  **Evidence**: README line 15 tells editors that section "eyebrows, titles, and descriptions" live on `site.sections`. Someone editing the Contact subtitle will find no description there. The `Omit` exists only to support this cross-wiring. `about` already uses the same `Omit`, which makes two exceptions on a three-field type whose description `SectionHeading` already treats as optional.
  **Suggestion**: Move the audiences sentence into `sections.contact.description`, delete `positioning.targetingLine`, and make `SectionCopy.description` optional instead of stacking `Omit`s. The four-audience check scans all copy, so it still passes.

### 5. [warning] The repeated-phrase test defines "figure" as "contains a digit", not with the codebase's `extractFigures`, and misses a real repeat

**Location**: `tests/copy-contract.test.ts:61-77` (line 70); `content/visitor-copy.ts:94-104`
**Finding**: The rule is "a five-word phrase without a figure". The test skips any five-word window that contains a digit (`/\d/`). The codebase already has a canonical figure parser, `extractFigures`, which the number-ledger test uses, and its docstring says "0→1" is a phrase, not a figure.

The logic is also written inline in the test. Its sibling helpers (`findBannedFraming`, `stripOfficialTitles`, `extractFigures`) live in `visitor-copy.ts`.
**Evidence**: I re-ran the test's tokenizer over `origin/main:content/site.ts` with both definitions. Exactly one phrase is flagged under `extractFigures` but let through by `/\d/`: "the 0→1 iphone india launch". On `main` it appears in both the bio and an Apple bullet. That is exactly the kind of repeat this PR set out to remove. The author fixed it by hand, but the test won't catch it if it comes back.

The scan also covers only strings in `site.ts`. Visitor-facing text written directly in components falls outside "any visitor-facing string": the contact labels, "What I'm looking for next", and the 404 copy.
**Suggestion**: Add `findRepeatedPhrases(text, n = 5)` to `visitor-copy.ts`, exempting phrases where `extractFigures(phrase).length > 0`, and have the test assert it returns `[]`.

### 6. [nit] The hero's fixed three-column grid squeezes the icons away on narrow phones and with large text

**Location**: `components/sections/hero.tsx:5-8`, `:38`, and the icons at `:44`, `:48`, `:57`
**Finding**: Below `sm`, the three actions are `grid grid-cols-3` cells with `px-3`. The SVG icons have no `shrink-0`, so they absorb the lost space.
**Evidence**: Measured in Chrome:

| Viewport | Root font size | Result                                                                                                      |
| -------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| 360 px   | 100%           | LinkedIn icon is 11 px wide                                                                                 |
| 340 px   | 100%           | LinkedIn icon is 5 px wide                                                                                  |
| 320 px   | 100%           | LinkedIn icon is 0 px; Résumé icon is 4 px                                                                  |
| 390 px   | 125%           | Résumé icon is 2 px; LinkedIn icon is 0 px                                                                  |
| 390 px   | 200%           | "Résumé" text spans 42–146 px inside a 40–133 px button, so the near-white label spills off the accent fill |

360 px is the most common Android width. The a11y gate only tests 390 px at default text size, so it can't see this. `main` stacked these buttons full-width on phones and didn't have the problem.
**Suggestion**: Add `shrink-0` to the icons, and let the row wrap (`flex flex-wrap`, or `grid-cols-[repeat(auto-fit,minmax(7rem,1fr))]`) instead of forcing three columns.

### 7. [nit] The résumé link is hand-copied in four places, and the copies drifted within this PR

**Location**: `components/nav.tsx:90-96`, `:135-142`; `components/sections/hero.tsx:39-46`; `components/sections/contact.tsx:53-57`
**Finding**: The rule "every résumé link downloads as `Jarrod-Tran-Resume.pdf`" is enforced by repeating `href={…resumeHref} download={…resumeFilename}` at each call site. External links repeat `target="_blank" rel="noreferrer"` the same way.
**Evidence**: `e3dec89` added `resumeFilename` to the hero only. The contact link kept a bare `download` until `ac09df2`, and both nav links did until `e1874a2`. The nav copies are still untested, because `sections.test.tsx` renders only Hero, Experience and Contact.
**Suggestion**: A small `ResumeLink` component (and optionally an `ExternalLink`) so the filename and attributes live in one place.

### 8. [nit] The new tests check stand-ins (source text, CSS substrings, deleted files) instead of the built page

**Location**: `tests/copy-contract.test.ts:112-119`, `:211-227`, `:173-176`
**Finding**:

- **Title test**: greps `app/layout.tsx` for the literal text `default: site.positioning.documentTitle`. Reformatting the file breaks it, and it never checks the rendered `<title>`.
- **Reveal test**: regex-matches `.reveal {` blocks and passes as long as the text "prefers-reduced-motion: no-preference" appears anywhere in `globals.css`. It doesn't check that the `.reveal` rule is inside that block.
- **Deleted-file checks**: it also asserts that `components/reveal.tsx` stays deleted and that `motion` is absent from `dependencies`. Those don't test behavior.
- **Two styles for the same fact**: the PR adds a render harness (`renderToStaticMarkup`) but keeps the grep tests. For example, the hero headline is checked by grep at `:173-176` and by rendering in `sections.test.tsx:47-54`.
  **Evidence**: I checked the real behavior in Chrome:
- With motion allowed, all 18 `.reveal` elements start at `translate: 0px 10px` below the fold, end at `none` after scrolling, and always have `opacity: 1`.
- Under reduced motion, none of them animate.
- The built `<title>` is 54 characters.

None of this is asserted anywhere, and `scripts/a11y.mjs` already has the built page loaded.
**Suggestion**: In `a11y.mjs`, assert that `(await page.title()).length <= 60`. Also assert that every `.reveal` element has computed `opacity === "1"`, and that none is still translated after an instant scroll to the bottom. Then delete the grep and deleted-file assertions.

### 9. [nit] The deploy-blocking a11y check runs on whatever Chrome the runner image ships

**Location**: `scripts/a11y.mjs:33-36`; `.github/workflows/deploy.yml`
**Finding**: `channel: "chrome"` uses the Google Chrome preinstalled on `ubuntu-latest`. That version changes with the runner image and isn't recorded anywhere, while `playwright-core@1.63.0` is pinned. Because this check now gates deploys, a Chrome update can change axe results or break the connection with no change in the repo.
**Suggestion**: At minimum, log `browser.version()` on every run. Consider pinning a browser in CI with playwright-core's own `install chromium`, or a version-pinned setup-chrome action.

### 10. [nit] Scope and documentation loose ends

**Location**: `scripts/js-size.mjs`; `content/site.ts:44`; `POSITIONING.md:60`
**Finding**:

- `pnpm size` isn't part of the stated intent and enforces nothing: it has no size budget and doesn't run in CI. Either turn it into a budget check or drop it.
- The `documentTitle` JSDoc says "Keep it under 60 characters", while the test and README say 60 at most.
- `POSITIONING.md` still names Formspree as a non-goal, but Formspree is gone from the codebase.

One process note: the file-search tool resolved one search against `/workspace` instead of the checkout. I discarded that result and redid all searches with `rg` inside `/home/ubuntu/wt/replay`. The checkout is untouched, and scratch files are in `/tmp/review-b/`.
