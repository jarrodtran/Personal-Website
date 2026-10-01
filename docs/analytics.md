# Analytics (hold)

No visitor analytics ship on the public site yet. Phase 4 only documents options — **do not** create a paid Plausible account from this workstream (that was an explicit reverse word). Prefer a deliberate, privacy-light choice after the domain serves this repo.

## Options when ready

| Option | Cost | Fit for this site |
| --- | --- | --- |
| **GoatCounter** | Free / cheap | Privacy-first pageview counts; small JS or pixel. Sensible default for a personal site. |
| **Plausible** | Paid SaaS, or self-host | Clean product analytics. Skip paid signup until chosen on purpose; self-host is fine later. |
| **Cloudflare Web Analytics** | Free with Cloudflare | Only if the apex moves behind Cloudflare. |
| **None / host logs** | Free | GitHub Pages does not give useful product analytics; fine to stay dark. |

## Hold criteria

Ship a snippet only when **all** of these are true:

1. `jarrodtran.com` points at this repo (domain cutover done — see README).
2. One option above is chosen on purpose (not “add Plausible” by default).
3. The snippet is loaded from first-party or a clearly disclosed privacy-friendly host, with no marketing pixels.

Until then: no analytics scripts, no cookies for tracking, no env placeholders that imply an active account.

## Optional GoatCounter (later)

If GoatCounter is chosen, wire a single script (or `noscript` pixel) in `app/layout.tsx` behind an explicit site code in `content/site.ts`. Do not invent a code here.
