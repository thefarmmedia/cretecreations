# Internal Linking Pass — Crete Creations LLC
**Date:** 2026-08-16

No visual design was changed. All additions are new `<a>` tags inside existing paragraphs, or new nav/footer/sidebar entries following the site's existing pattern (matching how "Polished Concrete" was added to the nav in an earlier round).

## Bug found: a real service page was completely unlinked

`/stamped` (Stamped & Stained Concrete — patios, pool decks, driveways) is a full, real service page that had **zero internal links pointing to it anywhere on the site** — not in the desktop nav, not in the mobile menu, not in any footer, not on `/services`. It was only reachable via `sitemap.xml` or a direct URL. Fixed by adding it to:
- The desktop "Specialty" nav dropdown (47 pages)
- The mobile "Specialty" menu section (47 pages)
- The footer Services column (47 pages)
- The sidebar service checklist on service/city pages (14 pages, where the pattern applies)
- A new service card on `/services` (it wasn't listed there either)

While fixing the mobile menu, found and fixed a second gap: **Concrete Repair was missing from the mobile "Specialty" menu** on all 46 affected pages (it was present in the desktop dropdown and footer, just not mobile) — mobile users had no nav path to that page at all. Added it alongside Stamped Concrete.

Also fixed a rendering bug while touching this block: the sidebar service checklist (`sb-list`) was missing a `<br>` after "Concrete Repair," which would have rendered it and "Polished Concrete" run together on one line instead of stacked.

## Other orphaned pages found and linked

Three more pages had zero internal inlinks — all part of the older SEO-landing-page set, each with a legitimate distinct intent (near-me search, extended service area, regional authority) that just had no path in from anywhere:
- `/epoxy-floors-near-me`
- `/epoxy-floors-springfield-mo`
- `/four-state-epoxy-contractor`

Linked all three from `/locations`, in the existing "Don't See Your City?" section — a natural fit, since that section already talks about service beyond the standard 18-city radius.

## Money-page cross-links added (from the Phase 2 cannibalization fix)

The three landing pages that were refocused in Phase 2 (cost/comparison angles instead of duplicating their parent service page) were also orphaned. Since they now serve a genuinely different, complementary purpose, linked each from its parent page in a spot where the connection is natural:

| From | To | Context |
|---|---|---|
| `/metallic-epoxy` | `/metallic-epoxy-joplin` | In the existing "Metallic Epoxy Pricing" section, as "see the cost breakdown for Joplin" |
| `/epoxy-floors` | `/garage-floor-coating-joplin-mo` | Next to the surface-prep section, as "comparing this to box-store paint or DIY kits?" |
| `/driveways` | `/driveway-overlay-joplin` | In the existing "Overlay vs. Full Replacement" section, as "see the full cost breakdown" |

## Blog → money page links

`/blog-epoxy-garage-use` only ever linked out to `/contact`, never to an actual service page — a partial dead end for a high-intent article (someone reading about garage floor durability is a strong buying signal). Added contextual links to `/epoxy-floors` (in the section about the 4-layer system) and `/epoxy-garage-floor-cost-joplin` (in the closing section, as a next step before contacting).

The other blog posts already link out appropriately: `/blog-driveway-overlays-guide` → `/driveways`, `/blog-choosing-your-floor` → `/epoxy-floors`, `/blog-complete-system-guide` → linked from `/about`, etc.

## What was checked and found already correct

- **Homepage → money pages**: `/` already links prominently to all core service pages in both the hero service grid and footer.
- **Service pages → city pages**: `/epoxy-floors`, `/metallic-epoxy`, `/driveways`, `/concrete-repair`, `/pool-deck-coatings` already link to every city page via the footer, and several have contextual body mentions of specific cities (e.g., `/joplin` and `/carthage`).
- **City pages → service pages**: every city page already links to all core services via its sidebar service checklist.
- **Anchor text variation**: nav/footer/sidebar links naturally repeat the same label everywhere (expected — that's standard site navigation, not spam). In-body contextual links already show healthy variation, e.g. links to `/epoxy-floors` use "Epoxy Garage Floors," "100% solids epoxy," "garage floors," "full flake systems," and more, depending on context — no single repeated exact-match anchor being force-fed for SEO.
- **Breadcrumbs**: every page already carries `BreadcrumbList` JSON-LD structured data (verified valid across all 59 indexable pages). There's no *visible* breadcrumb trail in the UI — adding one would be a visual/design change, which was explicitly out of scope for this pass. Flagging it as a future option rather than adding it silently.
- **Crawl depth**: with the orphan fixes above, every important page is now reachable from the homepage within 2 clicks (nav dropdown or footer), and no page requires more than 3.
