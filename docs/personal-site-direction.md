# Personal-site direction (proposed Nov 4, 2026)

Owner directive, Nov 4, 2026: jarrodtran.com is a personal website, not a
resume site and not a job-search site. This doc puts the full proposal in one
place for review: the structure, the homepage copy, what this PR already
changes, and what stays phased because it conflicts with current repo rules.

## Principle

Writing is the product. Work is context: one compressed block, subordinate.
The resume is a subordinate link (About and footer), never the organizing
purpose and never a nav item. A visitor should leave knowing how Jarrod
thinks and what he is writing about, not holding a hiring pitch.

## Sitemap (target state)

| Page        | URL         | Purpose                                               |
| ----------- | ----------- | ----------------------------------------------------- |
| Home        | /           | Who he is, featured writing, where to go next         |
| Writing     | /writing/   | Essays and notes index (see rule conflict below)      |
| About       | /about/     | The person: story, photo rule applies, interests (conditional, see phased plan) |
| Work        | /work/      | One compressed page of roles, in short form           |
| Contact     | /#contact   | Email, LinkedIn, subscribe, speaking                  |

Target nav: Writing, About (only if the homepage is still too long after
compression), Contact. Per round-2 review, /now/, Reading, and Colophon
are dropped from the target state.

## Homepage layout (target state)

1. Hero: headline, an intro sentence opening "I'm Jarrod Tran." (the name appears once, in prose, not as a separate name line), subscribe. Nav brand untouched.
2. Featured writing: three editor picks under a "Start here" label.
3. Latest writing: five most recent posts with dates.
4. About teaser: one short paragraph, link to /about/ (only if /about/
   ships; otherwise the About section stays on the homepage).
5. Work, briefly: compressed role lines (copy below).
6. How I think: the five existing principles, personal framing.
7. Contact: "Say hello." Email, LinkedIn, RSS, Substack.
8. Footer: location and a personal line, not a company list.

## Homepage copy (personal voice, drop-in)

Rules applied while drafting: no em-dashes or en-dashes, no banned framing
tokens in visitor copy, no figure that is not already on the resume ledger,
no five-word phrase repeated across strings, no invented career facts.

### Meta

- Title: keep `site.positioning.documentTitle` (tab-length rule).
- Description (valueProp, changed in this PR, round-5 wording, 152
  characters so it fits the 155 to 160 band search results show): "I lead
  AI enablement at Tesla Energy. My team builds tools people use.
  Here I write about the calls behind that work and what Apple and
  Waymo taught me." Round 5 drops "daily": the ledger supports 1,000+
  active users and 20+ production tools, but no source supports daily
  frequency, so the claim is out unless Jarrod confirms it.
- Status (OG image, changed in this PR, round-2 wording): "Notes on AI
  and judgment" replaces "Open to the right role."

### Hero

Keep the existing headline: "I write about AI product work, judgment, and
making a P&L move." It was always the personal thesis. On this branch
the hero component renders name plus headline only (pinned by
tests/sections.test.tsx), so the longer first-person intro lives in
About for now. Note: #114, already merged to main, removed the name h1,
so the homepage body no longer contains the name at all (only the nav
brand and footer copyright do). Round-3 resolution, per the follow-up
review: do not restore a separate hero name line, which would re-create
the nav-brand-plus-hero repetition #114 removed, and do not touch the
nav, which #94 and #102 are both editing. The target is option (2):
the hero intro sentence opens "I'm Jarrod Tran.", keeping one name
occurrence in prose. That hero change lands with the rebase step, and
the hero test must be reworked there.

### Writing (Worth Mulling)

Empty state: NOT changed in this PR (round-2 review, kept in round 3
and round 4). #109 merged on Nov 4, and the copy it renders on current
main is "First post coming soon. Subscribe to get it by email." This PR
still does not restore its earlier "First essays are in draft" change:
that is a claim only Jarrod can confirm. Restoring it waits on his
confirmation (round-3 owner call). Until then this PR leaves the writing
string alone.

Seed essays, converted from the existing case studies:

1. "The AI product that got used" (from /work/tesla-energy-ai-product/)
2. "Which dollar moves the P&L" (from /work/tesla-energy-portfolio/)
3. "0 to 1 in India" (from /work/apple-iphone-india/)

### About (second paragraph removed in round 3)

Round 2 added: "Most of my jobs started with an unclear brief and real
stakes. I get the facts, cut what doesn't matter, name an owner, and
stay until it ships." Round 3 removes it: #104 landed, so "How I think"
is the only home for the five principles, and the paragraph is a pure
duplicate of that surviving section. Dropping the paragraph, rather
than deleting the principles list #104 just kept, is the smaller fix
and keeps "say each thing once".

Still open: an outside-work line (training, travel, food). Drafted in the
working notes, not shipped, because only Jarrod can word it.

Round 5 direction (owner call, not done here): the About paragraph as it
stands still recaps the current title, the AI team, and the prior
employers immediately before Experience. In this direction About keeps
only personal perspective the owner has supplied, and Work carries the
chronology. The recap is not removed in this round because there is no
owner-supplied personal-perspective wording to replace it with, and
inventing outside-work details is out of bounds. The bio stays as is
until Jarrod supplies the replacement wording; the outside-work line
above is the same open call.

### Work, briefly (target copy, phase 2)

- Tesla Energy (2023 to now): current role. 20+ AI tools in production,
  1,000+ active users, and before the AI role, the investment roadmap
  behind the Megapack scale-up.
- Waymo (2022 to 2023): one planning and reporting rhythm across
  functions that had each been running their own.
- Apple (2021 to 2022): the 0 to 1 iPhone India launch, market entry to
  scaled delivery, exports from 6 to 40+ countries.
- Tesla (2018 to 2021): special projects, the 4680 program, Model 3 and
  Model Y scale-up.

Closing line: "That is the short version. LinkedIn has the long one; it is
better at being a resume than this site is."

Notes (round-2 review): the "six functions" figure was removed from this
target copy because it is not verified against public/resume.pdf. The
same wording still exists in the pre-existing Waymo case study in
content/site.ts, which is outside this PR's diff; that case study is
flagged for a ledger follow-up, not silently rewritten here. Amazon is
on the resume but missing from site.experience today; no Amazon line is
drafted here, because the earlier "fulfillment operations" wording is
banned operational framing and the review states only an approved bullet
may be used. Adding Amazon waits on that approved bullet (owner call).
The Tesla and Model 3 / Model Y "scale-up" lines above are target copy
only, not visitor copy yet, and need a framing check before they ship.

### How I think (heading changed in this PR)

Section heading changes from "How I work" to "How I think". The five
principles stay word for word.

### Contact (changed in this PR)

- Heading: "Say hello." (was "Looking for product, strategy, or AI roles.")
- Intro (round-5 wording): "I am always up for swapping notes on AI
  adoption. Based in Houston." Round 5 drops "Reply to anything I write"
  (the feed has no posts yet) and the "just email me" / "come speak
  about it" clauses, which repeat the Email and Speaking rows below.
  The rows carry the contact options; the intro stays factual.
- Rows stay: Email, LinkedIn, Speaking, Resume (subordinate, last row).

### Footer

NOT changed in this PR (round-2 review, kept in round 4). #98 merged
on Nov 4 and removed the company line, so the footer on current main is
name plus location only. This PR reverted its earlier "Essays, notes,
and the occasional strong opinion" change and still does not touch the
footer. A future tagline, if one comes back, is a separate decision.

## What this PR changes

1. content/site.ts: valueProp, status, about.bio,
   sections.approach.title, sections.contact.title, contact.intro.
   Round 2 also removes the job-search leftover about.lookingForIntro.
   Round 3 shortens valueProp to 158 characters and removes the
   round-2 About paragraph (duplicate of the surviving principles
   section after #104). Deliberately NOT changed in round 2 or 3:
   components/sections/writing.tsx and components/footer.tsx
   (reverted to base; #98 has merged and removed the footer company
   line, and #109 has merged its own empty-state copy, so the writing
   string waits only on Jarrod confirming the "in draft" claim).
   Round 5 drops "daily" from valueProp (no source for daily frequency)
   and shortens contact.intro to the round-5 wording; the doc records
   the About chronology-recap removal as an owner call and marks phased
   steps 3 and 4 as required gates.
2. tests/sections.test.tsx: CONTACT_INTRO follows the new copy;
   EMPTY_WRITING reverted to base; the contact test now also guards
   "consulting" as absent.
3. tests/copy-contract.test.ts: the positioning test now asserts the
   personal direction and asserts the retired audience pitch is gone from
   visitor copy, pinning the new status and valueProp strings instead of
   the generic "i write about" (which main already contained), and
   guarding "consulting" as absent. This is an intentional contract
   change for review.
4. POSITIONING.md: addendum pointing here. The main text is untouched so
   reviewers can diff the old brief against this proposal. A full
   rewrite is a round-2 owner call (see phased plan), not done here.
5. This doc: sitemap, layout, copy, and phased plan updated per round-2
   review, then again per round-3 review (#104 merged, #109 closed,
   hero fork, meta length, About duplicate), then again per round-4
   review (#109 and #98 merged, Capabilities gone on main), then again
   per round-5 review ("daily" dropped, contact intro shortened, About
   chronology recap parked as an owner call, steps 3 and 4 marked
   required gates).

## Conflicts with current repo rules (need an owner call, not done here)

- POSITIONING.md core direction says corporate operator positioning with
  four target audiences. The owner directive supersedes it, but the doc
  should be rewritten or retired in a follow-up once this direction is
  approved.
- rule:legacy-redirects: /writing/ and /work/ stay meta-refresh pages and
  case studies stay at /work/[slug]/. The target sitemap wants a real
  /writing/ index and essays at /writing/[slug]/. Not changed here.
- rule:no-photo: no photo of Jarrod ships. The usual personal-site advice
  (put a face in the hero) does not apply to this site. Kept.
- Hero test pins hero output to name plus headline only. A longer hero
  intro needs that test relaxed. Not changed here.
- selected-work-layout tests pin the Selected Work section's measured
  heights on the homepage. Compressing or removing Experience and
  Selected Work from the homepage (target layout above) needs
  those tests reworked. Not changed here.
- Capabilities section: target state deletes it from the homepage.
  #104 already deleted it on main, so after the rebase this PR no
  longer keeps it; the layout-test rework in phase 3 covers only
  Experience and Selected Work.

## Phased plan after approval

Corrected per round-2 review (subtraction first; the earlier version
listed "Work, briefly" as both phase 2 and step 5):

1. The open queue lands first. Update as of round 4: #104, #109, and
   #98 all merged Nov 4, so this step is done. The rebase in step 2
   picks up #104 (including its Capabilities removal), #109, #98, and
   #114. Rebase note (round-4 review): the merged tree must update
   tests/sections.test.tsx, the "has no Capabilities section and still
   renders How I work" test, to the new "How I think" title in both its
   name and its literal assertion, since this PR renames
   sections.approach.title.
2. Rewrite POSITIONING.md to the personal direction, then land the copy
   changes (with the round-2 line notes) rebased on current main. The
   rebase also has to rework the hero test for #114 (name h1 removed)
   and the layout tests pinned by #110, #112, and #115. Retire the
   audience pitch from outreach copy in the same rewrite; outreach
   wording itself is an owner call, because the current outreach strings
   are pinned by copy-contract tests and are not visitor copy.
3. Compress homepage Experience and Selected Work into
   "Work, briefly" (Capabilities already removed by #104); rework the
   layout tests in the same PR. Required gate (round-5 review): this PR
   alone leaves the current experience and case-study structure in
   place, so the redesign is not complete until this step lands.
4. Decide the writing URL question (owner call: a real /writing/ index
   breaks rule:legacy-redirects), then turn case studies into essays.
   Required gate (round-5 review): same as step 3, the essay conversion
   is a required phase, not an optional follow-up, before the redesign
   is called complete.
5. /about/ gets a brief only if the homepage is still too long after
   step 3. /now/, Reading, and Colophon are dropped.
6. Nav to Writing, About (conditional), Contact; resume link to About
   and footer.

## Review ask

@GrokBot: review for (a) copy quality and voice, (b) any figure, title, or
fact that drifts from the resume ledger or the official title, (c) rule
conflicts missed above, and (d) whether the phased plan is the right order.
Do not merge. Owner approval and the review-pass in docs/review-pass.md
still gate merge, per AGENTS.md.
