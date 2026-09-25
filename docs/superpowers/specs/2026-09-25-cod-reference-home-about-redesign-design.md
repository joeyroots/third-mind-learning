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

**Revision note (2026-09-25, same day):** PR #7
(`home/first-principles-rewrite`) independently rewrote Home's copy and
made a first attempt at visual hierarchy (serif headings, tint-band
sections, a split two-column "How" section, a photo+text bio grid) —
live at a Firebase preview URL. Joe reviewed it and found it too
subdued relative to COD — closer to an editorial blog than a marketing
page. Its commit (`e1e6a8f`) has been cherry-picked onto this branch
(now `0ddaa4e`) so this redesign builds on PR #7's copy, but the
**visual execution below supersedes PR #7's CSS** — bolder color-block
sections, bigger type scale, and a hero photo, per Joe's direct
feedback after seeing PR #7 rendered. The original "structure only,
lighter execution" fidelity call (below) is revised accordingly.

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
- New photography beyond the four photos Joe has now supplied (staged
  at `reference/joe-photos-2026-09/`) — no further photo sourcing is
  part of this spec.

## Approach: CSS

Extend the existing single `src/assets/css/site.css` file in place —
new component classes (`.stats`, `.testimonial-grid`, `.story-chapter`,
`.values-grid`, `.hero-photo`) added alongside the current rules,
reusing the existing design tokens (`--ink`, `--paper`, `--muted`,
`--accent`, `--rule`) plus one addition: a dark section-background
variant (see Visual direction, below).

No new CSS files, no build-step changes. Splitting into multiple CSS
files/partials (a small design-system layout) was considered and
rejected as premature for a two-page, ~100-line stylesheet — it's
solving for a scale this site doesn't have yet. Revisit only if a
future page redesign makes the single file unwieldy.

## Visual direction (revised)

Joe's decision after seeing PR #7 rendered: keep the earlier calls to
skip a custom webfont and any JS carousel (neither was reopened), but
push three things further toward COD's actual visual weight:

1. **Bold color-block sections**, not just subtle tint bands. At least
   one section per page (the hero, and Home's founder/credibility
   section) gets a solid dark background using `--ink` (#17202a,
   already in the palette — no new color token needed) rather than the
   current `--paper-tint`. Text on those sections switches to
   light-on-dark (`--paper` for body text, white/near-white for
   headings).
2. **Bigger typographic scale and contrast.** Push H1/H2 sizing and
   surrounding whitespace further than PR #7's already-larger serif
   sizes — larger jump between hero H1 and body copy, more breathing
   room around section headings, so section transitions read with the
   same punch COD's do.
3. **Testimonials as visual cards** — bordered/shadowed `.testimonial-grid`
   cards (already planned below), not a plain tinted quote block.

## Hero photo

COD's actual hero technique (`reference/clientsondemand-clone/…/index.html`,
`.hero-image` CSS): a full-bleed dark (`#020A27`) header band; a large
photo absolutely positioned to bleed in from the right, `background-size:
cover`, faded into the dark background via a linear-gradient overlay on
its left edge; headline, subhead, and CTA sit on the left, over solid
dark. TML adopts the same technique at smaller scale, using `--ink`
instead of introducing a new navy:

- New `.hero-photo` component: photo positioned right/behind, gradient
  fade into `--ink` on its left edge, headline block on the left over
  solid `--ink`. Mobile: photo drops below or behind at reduced
  opacity so text stays legible at narrow widths (COD does the
  equivalent with its own breakpoint rules).
- **Selected photo: `stage-blue-light.jpg`** (Joe's call, overriding
  the initial recommendation below). Dramatic blue stage lighting fits
  the dark-band treatment well. **Implementation note:** this photo has
  a partially legible banner in the background ("THE GL… ILD YOU…")
  for a different, unnamed event — the crop/positioning used in
  `.hero-photo` must push that text out of the visible frame (or far
  enough under the gradient fade that it's unreadable), so the hero
  doesn't appear to reference another program's branding. Verify this
  visually once implemented, not just by CSS math.
- *(Initial recommendation, superseded above): `portrait-backstage.jpg`
  — clean dark background, no crop concerns, but Joe chose the bolder
  stage shot instead.)*
- **Not used for the hero:** `stage-videowall-1.jpg` and
  `stage-videowall-2.jpg` — visually busy (dozens of small video
  tiles) and would compete with the headline once faded in.

**Placement of the remaining three (decided):**
- **Home founder/credibility section:** `portrait-backstage.jpg`,
  further down the page as the one other Home photo.
- **About page:** one video-wall shot — `stage-videowall-1.jpg`
  recommended (mid-gesture, one hand raised) over `-2.jpg` (both arms
  overhead) as the more natural static content photo; swap freely,
  it's a minor call.
- **Left out:** whichever of the two video-wall shots isn't used on
  About (`stage-videowall-2.jpg` if the recommendation above is kept).
  Not all four photos need a home on these two pages.

## Design: Home (`src/index.njk`)

COD's homepage flow — hero → proof bar → alternating feature blocks →
mid-page CTA → founder story → stats → testimonials → final CTA — maps
onto TML's existing content with two structural additions and one
re-sectioning pass. Order, top to bottom:

1. **Hero** (PR #7's copy, unchanged) — H1 + lede + primary CTA button,
   now on a dark `--ink` background with `stage-blue-light.jpg`
   bleeding in via the `.hero-photo` treatment described above —
   TML's version of COD's navy-band-plus-photo hero. Crop/position
   must keep the background banner text out of frame (see Hero photo
   section).

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

5. **Founder/credibility section** (PR #7's photo+text bio-grid
   content, unchanged copy) — this is already TML's version of COD's
   "Hi, I'm Russ Ruffino" founder block; gets the dark `--ink`
   color-block treatment as one of the "at least one more section"
   bold backgrounds called for above. Photo: `portrait-backstage.jpg`,
   in place of or alongside the current `joe-ruotolo-speaking.jpg`.

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
   dense narrative scannable rather than one wall of text). One
   chapter — best fit is probably "Where the method came from" or
   "Becoming a HeartMath® Trainer" — includes `stage-videowall-1.jpg`
   as an inline image; exact chapter is an implementation-time call.

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

- `.hero-photo` — dark band + right-bleed photo with gradient fade,
  headline over solid dark (Home)
- `.section--dark` — solid `--ink` background, light-on-dark text, for
  the hero and founder/credibility sections (Home)
- `.stats` — row of number/label pairs (Home)
- `.testimonial-grid` — grid of quote cards, replaces inline `.quote`
  usage for the two testimonials being consolidated (Home)
- `.story-chapter` — heading + paragraph(s) block, repeated per beat
  (About)
- `.values-grid` — small grid of heading + one-line statement (About)

No new color tokens (reuses `--ink`/`--paper`), no new fonts, no JS.

## Image slots

Joe has supplied four photos, staged at `reference/joe-photos-2026-09/`
(not yet wired into any template):

- **Home hero:** `stage-blue-light.jpg`, per the Hero photo section
  above (crop must keep the background banner text out of frame).
- **Home founder/credibility section:** `portrait-backstage.jpg`,
  replacing or sitting alongside the existing
  `joe-ruotolo-speaking.jpg`.
- **About:** one video-wall shot (`stage-videowall-1.jpg`
  recommended) placed within the story-chapter content. Existing
  `.bio-photo` in the hero is unchanged.
- **Unused:** the other video-wall shot (`stage-videowall-2.jpg` if
  `-1.jpg` is used on About) — not every supplied photo needs to
  appear on these two pages.

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
- All four photos placed: hero = `stage-blue-light.jpg`, Home
  founder/credibility = `portrait-backstage.jpg`, About = one
  video-wall shot (`stage-videowall-1.jpg` recommended). The other
  video-wall shot is unused. Only remaining call: confirm which
  About story chapter gets the photo, and which video-wall shot if
  Joe prefers `-2.jpg` over `-1.jpg`.
