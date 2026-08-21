# Positioning — keep this narrative

Single public story for [jarrodtran.com](https://jarrodtran.com). Do not fragment it into audience-specific pages, headlines, or toggles.

## Core Direction

Position Jarrod Tran as a high-signal **corporate operator / product & strategy** professional.

Emphasize:

- AI product work
- Cross-functional leadership
- Structured problem-solving
- Organizational impact

Tone: polished, confident, corporate. Company names, official job titles, and proven impact numbers stay factual.

Target conversations at:

1. Growth-stage tech
2. Consulting
3. Early-stage startups
4. VC-adjacent operator seats

## Single coherent narrative

There is one headline, one value proposition, and one About story. `headlineVariants` and per-bullet `audiences` tags are unused internal data — never ship four public versions.

Keep improving that one story. Do not create Tech / VC / Consulting / Startup forks of the page.

## Factory-language ban

Visitor-facing copy must not use factory, manufacturing, or heavy operational framing.

Banned tokens (case-insensitive): `factory`, `manufacturing`, `manufactured`, `mass production`, `shop floor`, `GWh`, `unit cost`, `cost per unit`, `supplier`, `logistics`, `battery-cell`, `Energy Manufacturing`.

`operator` is requested positioning, not a ban. Official titles (e.g. Lead, Global Planning & AI Adoption) stay. Recast mechanisms as product, strategy, investment, and organizational decisions. Keep the proof points; change the language around them.

Copy lives in [`content/site.ts`](content/site.ts) and section headings on `site.sections`. The contract is enforced by `pnpm test`.

---

## Plan-mode prompt (paste into Cursor)

```
Plan a change to this personal site. Do not implement until the plan is approved.

Core Direction: Position Jarrod Tran as a high-signal corporate operator / product & strategy professional. Emphasize AI product work, cross-functional leadership, structured problem-solving, and organizational impact. Tone: polished, confident, corporate. Target growth-stage tech, consulting, early-stage startups, and VC-adjacent operator seats.

Working style: one coherent public narrative — not four audience-specific stories or pages. Prefer concrete copy rewrites in content/site.ts (and site.sections for headings). Keep employers, official titles, and impact numbers; recast mechanisms as product, strategy, investment, and organizational decisions.

Factory-language ban: do not use factory, manufacturing, manufactured, mass production, shop floor, GWh, unit cost, cost per unit, supplier, logistics, battery-cell, or Energy Manufacturing in visitor-facing copy. Flag any drift back toward operational/factory language.

Non-goals unless I ask: visual redesign, new routes, audience-switcher UI, rewriting the résumé PDF, DNS, or Formspree.

Read POSITIONING.md and content/site.ts first. Propose the smallest copy (and only necessary code) change that keeps the live site aligned with this brief.
```

## Build prompt (paste after plan approval)

```
Implement the approved plan against this personal site.

Keep a single coherent corporate operator / product & strategy narrative for growth-stage tech, consulting, early-stage startups, and VC-adjacent operator seats. Emphasize AI product work, cross-functional leadership, structured problem-solving, and organizational impact. Polished, confident, corporate tone.

Edit content/site.ts (and site.sections) in place. Do not ship headlineVariants or per-bullet audiences as public UI. Do not invent employers, titles, or metrics.

Factory-language ban — visitor-facing copy must not contain: factory, manufacturing, manufactured, mass production, shop floor, GWh, unit cost, cost per unit, supplier, logistics, battery-cell, Energy Manufacturing.

After copy changes: pnpm test (copy-contract), pnpm check, pnpm build. Fix anything that fails before you stop.
```
