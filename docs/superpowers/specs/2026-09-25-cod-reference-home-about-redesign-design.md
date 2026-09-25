# Home + About redesign, informed by clientsondemand.com

## Context

Joe wants to try a different development format for this iteration of the
Third Mind Learning site: clone an existing, more visually developed
marketing site (clientsondemand.com, "COD") as a structural and visual
reference, then use it to inform a redesign of TML's existing Eleventy
templates — rather than designing from a blank page.

A static clone of COD's Home, Process, About, and Results pages already
exists at `reference/clientsondemand-clone/` (committed on this branch,
`copy/cod-clone-baseline`), pulled with `wget --mirror` including CSS,
fonts, and images. It is reference material only — never wired into the
Eleventy build, never linked from `src/`.

TML's current site (`src/index.njk`, `src/about.njk`,
`src/assets/css/site.css`) is intentionally bare: single-column text,
system fonts, 101 lines of CSS, one bio photo, no dedicated
testimonial/proof sections. COD, by contrast, is a full marketing site:
hero banners, a custom webfont, a press-logo ticker, photo-heavy
testimonial cards in a Swiper carousel, a company team grid, and a
10-item values grid.

## Scope

**In scope:** redesign `src/index.njk` (Home) and `src/about.njk` (About)
using COD's section structure and rhythm as a reference, executed at a
visual weight appropriate to a solo coaching practice rather than a
$100M sales-training brand.

**Out of scope (explicitly deferred, not part of this spec):**
- New pages modeled on COD's Process or Results pages — TML has no
  equivalent content yet and none is being written here.
- Contact and Privacy pages — stay as-is, utility pages.
- Custom webfont — TML keeps its system font stack. Distinctiveness
  comes from layout, spacing, and imagery, not typography.
- Any JS-powered widget (testimonial carousel, marquee/ticker) — COD's
  Swiper carousel and logo ticker are not being ported. Anything COD
  shows in a carousel becomes a static grid/list here.
- A company team grid — not applicable; TML is Joe, solo.
- Press-logo bar — TML has no press mentions to display; not ported.
- New photography — Joe will supply additional real photos separately;
  this spec designs image *slots* sized for them, not the sourcing of
  the photos themselves.

## Approach: CSS

Extend the existing single `src/assets/css/site.css` file in place —
new component classes (`.stats`, `.testimonial-grid`, `.story-chapter`,
`.values-grid`) added alongside the current rules, reusing the existing
design tokens (`--ink`, `--paper`, `--muted`, `--accent`, `--rule`).

No new CSS files, no build-step changes. Splitting into multiple CSS
files/partials (a small design-system layout) was considered and
rejected as premature for a two-page, ~100-line stylesheet — it's
solving for a scale this site doesn't have yet. Revisit only if a
future page redesign makes the single file unwieldy.

## Design: Home (`src/index.njk`)

COD's homepage flow — hero → proof bar → alternating feature blocks →
mid-page CTA → founder story → stats → testimonials → final CTA — maps
onto TML's existing content with two structural additions and one
re-sectioning pass. Order, top to bottom:

1. **Hero** (existing, unchanged in content) — H1 + lede + primary CTA
   button. Already matches COD's hero pattern structurally.

2. **Problem section** (existing "Why prepared students still
   underperform on test day" content, unchanged copy) — re-sectioned
   to read as a distinct block rather than a stacked paragraph run,
   matching COD's single-topic block rhythm.

3. **NEW: Proof/stats section.** A small row of 2-4 stats using real,
   already-known numbers (e.g. "150+ students coached," "Certified
   HeartMath® Trainer") — not invented figures. New `.stats` component:
   a flex/grid row of number + label pairs, styled plainly (no icons,
   no imagery), placed directly after the problem section to establish
   credibility early, the way COD's stats block does mid-page.

4. **Method section** (existing "Test prep for the material, state
   management for the pressure" content, unchanged copy) — same
   re-sectioning treatment as #2.

5. **Founder/credibility section** (existing "Who'll be in your teen's
   corner" content, unchanged copy) — kept as-is; this is already
   TML's version of COD's "Hi, I'm Russ Ruffino" founder block.

6. **NEW: Dedicated testimonials section.** The two quotes currently
   embedded inline inside the problem and method sections (Mason G.,
   and the unattributed SAT student quote) move out into one
   `.testimonial-grid` block of their own, placed right before the
   final CTA — matching COD's placement of testimonials as a
   late-page proof block before the close. Static grid, no carousel.
   Room for 2-4 cards; only 2 real quotes exist today, so the grid
   should look complete at 2 (not visibly built for a count it doesn't
   have).

7. **Final CTA** (existing "Start with a conversation" content,
   unchanged copy) — unchanged.

Net effect: same words TML already has, reorganized into COD's proof-
forward rhythm, plus one new stats block and one new testimonials
block using content that already exists elsewhere on the page today.

## Design: About (`src/about.njk`)

COD's About flow — hero w/ jump nav → chronological story chapters →
mid-page CTA → team grid → values grid → final CTA — maps onto TML's
About with two pieces skipped (team grid: not applicable to a solo
practice; jump nav: unnecessary at this page length) and two pieces
borrowed at reduced scale:

1. **Hero** (existing, unchanged) — H1 + lede + bio photo. Already
   matches COD's about-hero pattern; no change needed.

2. **NEW: Story broken into chapters.** TML's current About is one
   dense paragraph block covering background, the HeartMath
   certification, and the "Third Mind" name. Borrowing COD's
   "Vision Begins → Breakthrough Model → Scaling → Recognition →
   Future" chapter structure (without inventing a company-scale
   narrative TML doesn't have), split into named beats using Joe's
   existing bio content, e.g.:
   - "The problem I kept seeing" (what he noticed working with
     students)
   - "Where the method came from" (physics/math background, MBA)
   - "Becoming a HeartMath® Trainer" (the certification, what it adds)
   - "Why 'Third Mind'" (the name, the idea behind it)
   New `.story-chapter` component: each beat gets a short heading
   (h3) + 1-2 paragraphs, visually separated (COD uses this to make a
   dense narrative scannable rather than one wall of text).

3. **NEW: Values, scaled down.** COD's 10-item corporate values grid
   becomes 3-4 concrete coaching principles specific to how Joe works
   (e.g. how he thinks about pressure vs. skill, practice, state
   change) — not abstract corporate values. New `.values-grid`
   component: small grid of short heading + one-sentence statement,
   same visual pattern as COD's values block, much shorter list.
   Copy for these principles needs to be drafted — placeholder
   `<!-- CONTENT: ... -->` comments per `CLAUDE.md`'s existing
   convention until Joe provides or approves the actual statements.

4. **Location/close section** (existing "Based in Los Angeles... Get
   in touch" content, unchanged) — kept as the final section, same
   role as COD's final CTA.

**Explicitly skipped:** team grid (no team), jump nav (page is short
enough not to need in-page navigation).

## New CSS components needed

All added to `src/assets/css/site.css`, reusing existing tokens:

- `.stats` — row of number/label pairs (Home)
- `.testimonial-grid` — grid of quote cards, replaces inline `.quote`
  usage for the two testimonials being consolidated (Home)
- `.story-chapter` — heading + paragraph(s) block, repeated per beat
  (About)
- `.values-grid` — small grid of heading + one-line statement (About)

No new color tokens, no new fonts, no JS.

## Image slots

Per the imagery decision already made: Joe will supply additional real
photos separately. This spec reserves slots for them but does not
block on having them in hand:

- Home: no new image slots required by this design (stats and
  testimonials are text-only, matching "lighter execution").
- About: story chapters may each optionally take a small inline image
  once supplied; not required to ship the redesign. Existing
  `.bio-photo` in the hero is unchanged.

## Testing / verification

Per `CLAUDE.md`'s existing workflow:
1. `npm run dev`, review both pages at desktop and phone width.
2. `npm run check` must pass (build + validation suite) — including
   the existing rule that every page has exactly one `<h1>` and sets
   `title`/`description` front-matter (unaffected by this redesign,
   but worth explicitly re-verifying since About's structure changes
   most).
3. `npm test` (unit + output tests) — `test/site.test.mjs` currently
   checks page content; will need updates if it asserts on the exact
   paragraph structure being reorganized here (verify during
   implementation, not assumed here).

## Open items for Joe

- Real numbers for the Home stats block (student count, certification,
  years, etc. — whatever is accurate).
- Draft or approve copy for the 3-4 About values statements (currently
  placeholder-blocked per `CLAUDE.md` convention).
- Confirm whether the two existing testimonial quotes (Mason G. and
  the unattributed SAT student) are the only two available, or if more
  exist to fill out the testimonial grid.
