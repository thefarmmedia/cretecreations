# Technical SEO Audit — Crete Creations LLC
**Domain:** https://cretecreationsllc.com/
**Date:** 2026-08-16
**Scope:** Full codebase audit of URL canonicalization, redirects, sitemap, robots.txt, internal linking, and a search for leftover content from other markets/businesses.

No deploy was performed. All changes are on the working branch, ready for review.

---

## Summary

The single biggest problem on the site was **internal links pointing to `.html` URLs everywhere, while every page's canonical tag already declared the extensionless URL as correct** — and nothing at the server level enforced that. That's exactly what Google Search Console was flagging: `/bentonville.html`, `/contact.html`, `/gallery.html`, etc. were all live, 200-status, crawlable URLs sitting alongside their canonical counterparts, with only a "soft" canonical tag (which Google doesn't always honor) telling search engines which one mattered.

That's now fixed at both layers: every internal link on the site points directly to the canonical URL, and every `.html` path now hard-301-redirects to it.

A second real bug was found and fixed along the way: all 19 Google Maps embeds on `/locations` were using fabricated place-ID hashes and sequential fake timestamps instead of real embed data — a leftover from however that page was originally templated. They've been replaced with reliable, verified embed URLs.

---

## Issues Found & Fixed

### 1. HTTP vs HTTPS duplicate URLs — FIXED (code-level safety net added)
No `netlify.toml` and no existing `_redirects` rule forced HTTPS. Netlify's platform-level "Force HTTPS" setting is the primary control here (see **Needs Netlify/DNS Action** below), but I added an explicit rule as a code-level guarantee that doesn't depend on that dashboard toggle:
```
http://cretecreationsllc.com/*  https://cretecreationsllc.com/:splat  301!
```

### 2. www vs non-www duplicates — FIXED (code-level safety net added)
Same situation — no code enforced the apex domain as canonical. Added:
```
http://www.cretecreationsllc.com/*   https://cretecreationsllc.com/:splat  301!
https://www.cretecreationsllc.com/*  https://cretecreationsllc.com/:splat  301!
```

### 3. `.html` vs extensionless duplicate pages — FIXED (the big one)
- Every page's `<link rel="canonical">` already correctly pointed to the extensionless URL (e.g. `contact.html`'s canonical is `https://cretecreationsllc.com/contact`) — this part was already right.
- But **6,689 internal `href="page.html"` links** across all 60 real pages pointed to the `.html` version instead of the canonical one (only 629 links used the correct extensionless form, mostly on the older SEO landing pages). Rewrote every one of them to point directly at its canonical URL, using each page's own `<link rel="canonical">` as the source of truth (not just stripping `.html`, in case any slug ever differs).
- Added a hard 301 redirect from every page's `/page.html` URL to its canonical `/page` URL (56 rules, one per page, in `_redirects`), plus `/index.html → /`. This closes the exact gap GSC was reporting — `.html` URLs no longer return 200, they redirect.
- `faq.html` had 10 additional internal links written with single quotes (`href='...'`) that the first pass missed; caught and fixed separately.

### 4. Trailing slash inconsistencies — PASS, no issue found
Checked every canonical tag and every internal link for a trailing slash beyond the root `/`. None found.

### 5. Duplicate canonical tags — PASS
No two indexable pages share the same canonical URL.

### 6. Missing canonical tags — 1 found, not a real-world issue
`calculator.html` has no canonical tag. This page is the deprecated cost-calculator (retired in an earlier round of work — the business no longer offers this feature). It's not linked from anywhere on the site and both `/calculator` and `/calculator.html` now 301 to `/contact`, so it's unreachable in practice. Left the file itself alone rather than delete it (out of caution — not touching content the business may still want on hand).

### 7. Canonicals pointing to the wrong URL — PASS
Cross-checked every canonical URL against `sitemap.xml`: **exact 1:1 match, zero mismatches, zero missing entries in either direction.**

### 8. Internal links pointing to redirected URLs — 1 found, fixed
`llms.txt` (the AI-crawler discovery file) still had a bullet point linking to `/calculator` and describing it as a live feature. Removed that entry. No HTML page linked to any redirected/legacy URL.

### 9–12. Duplicate titles / meta descriptions / H1s / multiple-H1 pages — PASS
Checked all 59 indexable pages:
- Titles: all unique.
- Meta descriptions: all unique.
- H1 text: all unique (no two pages share an H1).
- H1 count: every page has exactly one `<h1>`.

### 13. Incorrect robots directives — PASS
`robots.txt` is correct: `Allow: /` for all agents, correct sitemap reference.

### 14. Pages accidentally marked noindex — PASS
Only the 3 intentional legacy redirect-stub pages (`epoxy-floors-rogers-ar.html`, `epoxy-floors-fayetteville-ar.html`, `epoxy-floors-grand-lake-ok.html`) carry `noindex`. No real content page is accidentally blocked.

### 15–16. Broken internal links / 404s linked internally — PASS after fix
Programmatically verified every root-relative `href` and every image `src`/CSS `url()` reference resolves to an actual canonical page or an actual file on disk. Zero broken links, zero missing images.

### 17. Redirect chains — PASS for realistic cases
Every `_redirects` rule resolves in a single hop from any URL that's actually indexed or linked today. One theoretical edge case remains: a URL that is simultaneously wrong on *all three* axes (e.g. `http://www.site.com/contact.html`) would take 2 hops to resolve fully. This doesn't reflect any URL Google currently has indexed (which are HTTPS + apex domain already, just with the wrong extension), so it's noted but not fixed with per-combination rules — that would mean hundreds of extra redirect rules for a case that doesn't occur in practice.

### 18–20. Sitemap issues (redirecting URLs / HTTP / `.html`) — PASS
`sitemap.xml` contains only canonical, HTTPS, extensionless URLs. No entries redirect, none use HTTP, none use `.html`.

---

## Leftover-content search (other markets/businesses)

Searched the entire codebase (`*.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, `style.css`) for:
- **North Granby, Ladue, Troy, Omaha** — zero matches.
- Other out-of-territory cities (St. Louis, Kansas City, Chicago, Dallas, Nashville, etc.) — zero matches.
- Other phone numbers besides `(417) 483-7082` — zero (only a form placeholder example `(417) 555-1234` and a generic `you@email.com` form-field hint, neither of which is a real/visible claim).
- Other email addresses besides `artvette68@yahoo.com` — zero.
- Other business/domain names — zero.

**The site's content is clean.** Everything reflects Crete Creations LLC's real Joplin-based, Four-State service territory.

---

## Bug found outside the checklist: fake Google Maps embeds on `/locations`

All 19 city cards on the locations page embedded Google Maps using a hand-built `pb=` parameter string with a fabricated place-ID hash (`0x87c8e0d03a2f8e2f:0x1`, `:0x2`, `:0x3`... sequential fake hex) and sequential fake timestamps (`1700000000000`, `...001`, `...002`...). These were not real embed URLs copied from Google Maps — they were synthesized, and unreliable (Google's embed endpoint may or may not tolerate an invalid place-id suffix). Replaced all 19 with the same reliable `https://www.google.com/maps?q=<City>,+<State>&output=embed` format already used successfully on the contact page — no fake IDs required, guaranteed to render the correct city.

## Stale copy found outside the checklist: `llms.txt`
Still referenced "free on-site quote" language that was removed from the actual site pages in an earlier round of edits (business decision to stop promising on-site visits). Updated to match: "on-site quote(s)" → "quote(s)" throughout.

---

## Files Changed

| File | Why |
|---|---|
| `_redirects` | Added HTTPS-force, www→apex-force rules, `/calculator.html` redirect, and 56 new `/page.html → /page` redirects (one per page) |
| 60 `*.html` files | Rewrote internal `href="page.html"` links to canonical extensionless form (6,689 links) |
| `faq.html` | Additionally fixed 10 single-quoted `href='page.html'` links the main pass missed |
| `locations.html` | Replaced 19 fabricated Google Maps embed URLs with reliable query-based embeds |
| `llms.txt` | Removed stale `/calculator` reference; replaced "on-site quote(s)" language |

No page content, forms, calculators (the working contact form), phone buttons, navigation, or galleries were removed or redesigned.

---

## Remaining Concerns — Needs Netlify/DNS Action (not fixable in code)

1. **Confirm Netlify's Primary Domain setting** is `cretecreationsllc.com` (apex/non-www), not `www.cretecreationsllc.com`. The `_redirects` rules I added are a safety net, but this dashboard setting is the authoritative source and worth a direct look in Site Settings → Domain Management.
2. **Confirm "Force HTTPS" is enabled** in the same Domain Management panel. Same reasoning — the code-level redirect is a backstop, not a replacement for the platform setting.
3. **Google Search Console re-crawl**: after this deploys, the http/www/`.html` duplicate signals GSC is currently showing will only clear once Googlebot re-crawls the redirected URLs and updates its index. This takes time on its own; see the indexing-priority list in the final QA report for which URLs to manually request indexing for first.
4. The 3 legacy stub files (`epoxy-floors-rogers-ar.html`, `epoxy-floors-fayetteville-ar.html`, `epoxy-floors-grand-lake-ok.html`) are now fully shadowed by `_redirects` — both their `.html` and extensionless paths 301 before Netlify ever reaches the file. They're harmless dead weight, not linked from anywhere. Left in place; could be deleted in a future cleanup if you want.
