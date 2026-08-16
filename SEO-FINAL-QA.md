# Final Technical / Local SEO QA — Crete Creations LLC
**Date:** 2026-08-16

## Status by category

| Category | Status | Notes |
|---|---|---|
| Structured data validity (JSON-LD) | **PASS** | 0 parse errors across every `<script type="application/ld+json">` block site-wide. |
| Schema types used | **PASS** | LocalBusiness, Organization-equivalent, Service, BreadcrumbList, FAQPage, BlogPosting — all match visible on-page content. No schema added just to chase a rich result. |
| Fake ratings/reviews/addresses/locations | **PASS** | Only one `aggregateRating` block exists (homepage, 5.0/6 reviews) and it matches the real testimonials displayed on the page. Every city-page `LocalBusiness` schema correctly keeps the address at Joplin, MO and uses `areaServed` for the city — none claims a fake office/location in the served city. |
| NAP (name/phone/address) consistency | **PASS** | Every schema instance uses "Crete Creations LLC," `+14174837082`, and Joplin, MO. Verified programmatically across all 33 pages carrying a `telephone` field — one phone number, no variants. |
| Sitemap.xml | **PASS** | Re-verified after all edits — still exact 1:1 match against canonical URLs, HTTPS only, no `.html`, nothing redirecting. |
| robots.txt | **PASS** | Unchanged, already correct. |
| Canonical tags | **PASS** | Unchanged from Phase 1 fix — every indexable page self-references correctly. |
| Open Graph URL | **FIXED** | Only 1 of 63 pages had `og:url`. Added it to all 59 indexable pages (matching each canonical URL exactly), plus filled in missing `og:title`/`og:description`/`og:type` on the 3 pages that had none at all (`colors`, `faq`, `locations`). |
| Page titles / meta descriptions | **PASS** | Verified unique across all indexable pages in Phase 1; Phase 2/3 edits kept uniqueness intact. |
| Heading hierarchy | **PASS** | Every page has exactly one H1; H2/H3 nesting spot-checked across page types (service, city, blog) with no level-skipping found. |
| Image alt text | **PASS** | Every `<img>` tag site-wide has an `alt` attribute (verified programmatically, zero missing). |
| Image width/height / CLS | **PASS** | No images use explicit HTML `width`/`height` attributes, but all use CSS `aspect-ratio` or fixed dimensions instead, which achieves the same layout-stability goal. This is already validated working — a Lighthouse run earlier in this project measured CLS at 0.053 (green/passing). Not changed. |
| Lazy loading | **PASS** | Below-the-fold images already use `loading="lazy"`; hero/above-fold images correctly omit it or use `fetchpriority="high"` instead (this was tightened in an earlier Lighthouse pass this project — hero images now get `<link rel="preload">` for LCP). |
| Broken internal links / 404s | **PASS** | Re-verified after all Phase 2-4 edits — zero broken links. |
| Redirect loops | **PASS** | No `_redirects` rule's source matches its own target; verified programmatically. |
| Duplicate pages | **PASS** | Covered in Phase 1 (`.html` dupes) and Phase 2 (keyword-intent dupes). |
| Mobile viewport | **PASS** | Present on all 63 files. |
| Favicon / site identity | **FIXED** | No favicon existed anywhere on the site — every browser tab was requesting a nonexistent `/favicon.ico` and showing a blank icon. Added `<link rel="icon">` using the existing logo to all 63 pages. |
| Breadcrumb links | **PARTIAL — see note** | `BreadcrumbList` structured data exists correctly on all 59 pages. There's no *visible* breadcrumb trail in the UI. Adding one would be a visual/design change, out of scope for an SEO pass that was explicitly told not to redesign the site — flagging as a future option, not fixing silently. |
| Performance (images, blocking resources, dimensions) | **PASS (already addressed)** | Already handled in an earlier Lighthouse-focused pass this project: hero image LCP preloading, JPEG conversion of oversized images, mobile touch-target sizing, and link-contrast fixes. Not re-litigated here since nothing changed that would regress it. |

## Bugs found and fixed outside the checklist (real functional issues)

These aren't strictly "SEO" but were found during this pass and are serious enough to flag and fix immediately:

1. **Two broken lead-capture forms were silently failing.** The homepage's "Quick Quote Request" form and the `/locations` page's "Quick Quote Request" form both showed a fake "✓ Submitted!" success message but never actually sent the data anywhere — no webhook call, nothing. Any visitor who filled out either form believed they'd contacted Arturo; he never received it. Both are now wired to the same LeadConnector webhook that powers the working `/contact` form.
2. **Dead JS on `/stamped`**: a `SF()` function handled a form submission that didn't exist anywhere on the page (no `<form>` calls it) — harmless, but misleading leftover code. Removed.
3. **`/stamped` had zero internal links pointing to it anywhere on the site** — a complete, real service page (patios, pool decks, stamped driveways) reachable only via the sitemap. Added to the nav, mobile menu, footer, sidebar service lists, and `/services`.
4. **Mobile nav was missing "Concrete Repair"** on 46 pages (present on desktop and in the footer, but not the mobile menu) — mobile users had no nav path to that service page at all. Fixed alongside the `/stamped` fix.
5. **19 fake Google Maps embeds on `/locations`** (found and fixed in the earlier technical-SEO pass, noted here for completeness).

## Files changed in this Phase 2-5 pass

`joplin.html`, `metallic-epoxy-joplin.html`, `garage-floor-coating-joplin-mo.html`, `driveway-overlay-joplin.html`, `epoxy-garage-floor-cost-joplin.html` (cannibalization refocus — titles/H1/meta/opening copy), `blog-epoxy-garage-use.html` (dead-end fix), `metallic-epoxy.html`, `epoxy-floors.html`, `driveways.html` (cross-links to refocused pages), `locations.html` (orphan links, form fix, og tags), `services.html` (added Stamped Concrete card), `stamped.html` (dead code removal), `index.html` (homepage form fix), 47 pages (nav/mobile/footer/sidebar Stamped Concrete + mobile Concrete Repair fix), 59 pages (`og:url`), 63 pages (favicon), plus `colors.html` and `faq.html` (full OG tag set added).

---

## Summary for deployment

### 1. Files changed
See table above and the individual `SEO-*.md` reports for the full breakdown per phase.

### 2. Technical SEO fixes
Covered in `SEO-TECHNICAL-AUDIT.md` (Phase 1): internal link canonicalization, `.html` redirects, fake map embed fix, `llms.txt` cleanup.

### 3. On-page SEO fixes
Covered in `SEO-KEYWORD-MAP.md` and `SEO-PAGE-IMPROVEMENTS.md` (Phases 2-3): 4 cannibalizing pages refocused with distinct intent, `/joplin` broadened, one dead-end blog post fixed.

### 4. Internal linking fixes
Covered in `SEO-INTERNAL-LINKING.md` (Phase 4): `/stamped` and 3 other orphaned pages linked in, mobile nav gap fixed, cross-links added between refocused pages and their parent service pages.

### 5. Schema fixes
`og:url` added site-wide; verified no fake ratings/addresses/reviews anywhere; confirmed NAP consistency programmatically.

### 6. Redirects to configure in Netlify
None beyond what's already in `_redirects` (deployed via Phase 1). Confirm in the Netlify dashboard: primary domain = apex (non-www), and "Force HTTPS" is enabled — the code-level redirects are a backstop, not a replacement for those settings.

### 7. Manual steps in Google Search Console
- Use URL Inspection → Request Indexing on the 10 URLs below once this deploys.
- Watch the "Page indexing" report over the following weeks — the http/www/`.html` duplicate signals should clear as Googlebot re-crawls and picks up the new redirects and canonical-only internal links.
- If you have a verified Google Business Profile, this is unrelated to GSC but worth a periodic check that the NAP there matches the site (Crete Creations LLC, Joplin MO, (417) 483-7082).

### 8. Priority URLs to request indexing for first
1. `/` (homepage)
2. `/joplin` (retargeted — concrete contractor intent)
3. `/epoxy-floors`
4. `/metallic-epoxy`
5. `/driveways`
6. `/stamped` (previously orphaned, now newly discoverable)
7. `/services`
8. `/locations`
9. `/contact`
10. `/blog-epoxy-garage-use` (now links to money pages instead of dead-ending)

Not deployed. All changes are on the working branch, ready for review before push.
