# Home + About Redesign (COD-informed) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `src/index.njk` (Home) and `src/about.njk` (About) using clientsondemand.com's structure and visual weight as a reference — bold dark color-block sections, a hero photo, bigger typographic scale, testimonials as cards, and About split into story chapters plus a small values grid.

**Architecture:** Pure static-site content/CSS change. No new pages, no JS, no build tooling changes. Three new photos get cropped from raw sources and dropped into `src/assets/img/`. All new visual treatment lives in the single `src/assets/css/site.css` file as additive component classes (`.section--dark`, `.hero-photo`, `.stats`, `.testimonial-grid`, `.story-chapter`, `.values-grid`), reusing the existing `--ink`/`--paper`/`--accent` tokens.

**Tech Stack:** Eleventy (njk templates) → static HTML in `_site/`. Plain CSS, no preprocessor. Python 3 + Pillow for one-time image cropping (already verified available on this machine). Node's built-in test runner (`node --test`) + `cheerio` for assertions, `html-validate` + `linkinator` via `npm run check`.

**Spec:** `docs/superpowers/specs/2026-09-25-cod-reference-home-about-redesign-design.md`

## Global Constraints

- No custom webfont — keep the existing `--font-sans`/`--font-serif` system stack. (Spec: Out of scope.)
- No JS-powered widgets (no carousel, no marquee) — testimonials and any repeating content are static grids. (Spec: Out of scope.)
- All new CSS goes into the existing single `src/assets/css/site.css` file — no new CSS files, no build-step changes. (Spec: Approach: CSS.)
- No new color tokens — dark sections use the existing `--ink`/`--paper` pair. (Spec: Visual direction.)
- Unfinished real copy (the About values-grid statements) ships as visibly-placeholder text with an `<!-- CONTENT: ... -->` comment per `CLAUDE.md`'s convention — never invented finished messaging. (`CLAUDE.md`; spec Design: About §3.)
- Every page keeps exactly one `<h1>` and non-empty `title`/`description` front-matter. (`CLAUDE.md`.)
- `npm run check` must print `0 problems` before any push — run it at the end of every task that touches `src/index.njk` or `src/about.njk`, not just at the end of the plan. (`CLAUDE.md`.)
- Work happens in this worktree (`.claude/worktrees/cod-clone-baseline`, branch `copy/cod-clone-baseline`) — never touch the main repo checkout at `~/Code/third-mind-learning`, which another session is actively using.

## Review Focus

- Hero photo's background banner text ("THE GL… ILD YOU…") reappearing at viewport widths between the two standard breakpoints (e.g. a laptop around 900px), since the gradient/crop was only validated at the crop stage, not across the full responsive range — pinned in Task 9 with an explicit mid-width screenshot.
- Text on `.section--dark` (hero, founder section) failing real contrast against `--ink`, not just "looking fine" in a screenshot — pinned in Task 2 with an automated WCAG contrast-ratio assertion on the actual color pairs used.
- New `<img>` tags shipping with empty or lazy placeholder alt text (`alt=""` or `alt="image"`), a real accessibility regression — pinned in Tasks 3, 5, and 7 with assertions that alt text is non-empty and mentions Joe.
- The multi-MB raw source photos (`reference/joe-photos-2026-09/`, up to 18.7MB) getting referenced by accident instead of the optimized `src/assets/img/` crops, bloating page weight — pinned in Task 9 with an explicit total page-weight check.
- A typo'd image path or a leftover reference to a removed testimonial figure breaking silently (wrong `src`, dangling anchor) — pinned by running `npm run check` (broken-link + html-validate, not just the Node test suite) at the end of every task, not only at the end.

---

## File Structure

- **Create:** `scripts/prepare-redesign-images.py` — one-time crop/resize script (kept in the repo as a record of exactly how the three new photos were derived from the raw sources; not part of the build).
- **Create:** `src/assets/img/joe-ruotolo-hero.jpg` (1600×1502) — Home hero photo.
- **Create:** `src/assets/img/joe-ruotolo-founder.jpg` (692×900) — Home founder/credibility section photo.
- **Create:** `src/assets/img/joe-ruotolo-about.jpg` (1200×942) — About story-chapter photo.
- **Modify:** `src/assets/css/site.css` — bigger type scale, `.section--dark`, `.hero.section--dark` (hero photo treatment), `.stats`, `.testimonial-grid`, `.story-chapter`, `.values-grid`.
- **Modify:** `src/index.njk` — hero photo + dark treatment, new stats section, founder section → dark + new photo, testimonials pulled into a dedicated grid.
- **Modify:** `src/about.njk` — bio split into four story chapters (one with a photo), new values-grid section.
- **Modify:** `test/site.test.mjs` — structural assertions for each new element, plus the contrast and page-weight checks.

---

### Task 1: Prepare the three new image assets

**Files:**
- Create: `scripts/prepare-redesign-images.py`
- Create: `src/assets/img/joe-ruotolo-hero.jpg`
- Create: `src/assets/img/joe-ruotolo-founder.jpg`
- Create: `src/assets/img/joe-ruotolo-about.jpg`

**Interfaces:**
- Produces: three JPEG files at fixed, known dimensions — `joe-ruotolo-hero.jpg` (1600×1502), `joe-ruotolo-founder.jpg` (692×900), `joe-ruotolo-about.jpg` (1200×942) — that later tasks reference by exact path and `width`/`height` attribute.

- [ ] **Step 1: Write the crop/resize script**

Create `scripts/prepare-redesign-images.py`:

```python
#!/usr/bin/env python3
"""One-time derivation of the three redesign photos from raw sources in
reference/joe-photos-2026-09/. Crop boxes were picked by hand (visually
verified) to exclude a third-party event banner (hero) and the most
legible third-party logos (about), and to frame a clean portrait
(founder). Re-run only if the source photos change."""
from PIL import Image

SRC = "reference/joe-photos-2026-09"
OUT = "src/assets/img"

jobs = [
    # (source file, crop box, output width, output file, quality)
    (f"{SRC}/stage-blue-light.jpg", (0, 0, 4934, 4633), 1600, f"{OUT}/joe-ruotolo-hero.jpg", 82),
    (f"{SRC}/portrait-backstage.jpg", (440, 0, 1490, 1365), 692, f"{OUT}/joe-ruotolo-founder.jpg", 85),
    (f"{SRC}/stage-videowall-1.jpg", (310, 0, 2048, 1365), 1200, f"{OUT}/joe-ruotolo-about.jpg", 82),
]

for src, box, width, out, quality in jobs:
    im = Image.open(src)
    im = im.crop(box)
    im.thumbnail((width, 999999))
    im.save(out, quality=quality, optimize=True)
    print(f"{out}: {im.size[0]}x{im.size[1]}")
```

- [ ] **Step 2: Run it and verify the exact output dimensions**

Run: `python3 scripts/prepare-redesign-images.py`

Expected output (must match exactly — later tasks hardcode these numbers in `width`/`height` attributes):
```
src/assets/img/joe-ruotolo-hero.jpg: 1600x1502
src/assets/img/joe-ruotolo-founder.jpg: 692x900
src/assets/img/joe-ruotolo-about.jpg: 1200x942
```

If any dimension differs, stop — a later task's `width`/`height` attributes will be wrong. (This has already been run once during planning and produced exactly these numbers from the current source photos.)

- [ ] **Step 3: Visually confirm each crop**

Use the Read tool to view all three output files:
- `src/assets/img/joe-ruotolo-hero.jpg` — confirm no readable banner text is visible anywhere in frame.
- `src/assets/img/joe-ruotolo-founder.jpg` — confirm a clean head-and-shoulders portrait, nothing cut off awkwardly.
- `src/assets/img/joe-ruotolo-about.jpg` — confirm Joe is fully in frame; some background video-wall tiles with small text are expected and acceptable (this is about-page inline content, not the hero).

- [ ] **Step 4: Commit**

```bash
git add scripts/prepare-redesign-images.py src/assets/img/joe-ruotolo-hero.jpg src/assets/img/joe-ruotolo-founder.jpg src/assets/img/joe-ruotolo-about.jpg
git commit -m "Add cropped hero, founder, and about photos for the redesign"
```

---

### Task 2: CSS foundation — bigger type scale, dark sections, hero photo treatment

**Files:**
- Modify: `src/assets/css/site.css`
- Test: `test/site.test.mjs`

**Interfaces:**
- Produces: CSS classes `.section--dark`, `.hero.section--dark` + `.hero-photo` (used on an `<img class="hero-photo">` inside `.hero.section--dark`), consumed by Tasks 3 and 5. Also produces `.stats`/`.stat`/`.stat-number`/`.stat-label` (Task 4), `.testimonial-grid` (Task 6), `.story-chapter` (Task 7), `.values-grid`/`.value` (Task 8) — all added now so later tasks only touch `.njk` files.

- [ ] **Step 1: Write the failing contrast test**

Add to `test/site.test.mjs` (after the existing imports, as a new top-level test — needs no build, so it can run standalone):

```js
function relativeLuminance(hex) {
  const c = hex.replace("#", "").match(/.{2}/g).map((h) => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrastRatio(hexA, hexB) {
  const [l1, l2] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

test("dark-section text colors meet WCAG AA contrast against --ink", () => {
  const ink = "#17202a";
  assert.ok(contrastRatio(ink, "#fdfcf9") >= 4.5, "heading color (--paper) on --ink meets 4.5:1");
  assert.ok(contrastRatio(ink, "#d7dade") >= 4.5, "body text color on --ink meets 4.5:1");
});
```

- [ ] **Step 2: Run it to verify it currently fails or passes on the chosen colors**

Run: `node --test test/site.test.mjs`

Expected: this specific test PASSES immediately since it only checks arithmetic on fixed hex values, not built output — that's fine, it's a guard against picking bad colors later, not a red/green cycle on markup. Confirm it passes now with these exact hex values before using them in CSS below.

- [ ] **Step 3: Add the type-scale and section-padding changes**

In `src/assets/css/site.css`, replace:

```css
h1 { font-size: 2.25rem; margin: 0 0 1rem; }
h2 { font-size: 1.85rem; margin: 0 0 1rem; }
```

with:

```css
h1 { font-size: 2.5rem; margin: 0 0 1rem; }
h2 { font-size: 2rem; margin: 0 0 1rem; }
```

Replace:

```css
.hero { padding: 3.5rem 0 3rem; }
.section { padding: 3rem 0; }
```

with:

```css
.hero { padding: 4rem 0 3.5rem; }
.section { padding: 3.5rem 0; }
```

Replace:

```css
@media (min-width: 40rem) {
  h1 { font-size: 3rem; }
  h2 { font-size: 2.1rem; }
  .hero { padding: 5rem 0 4rem; }
  .section { padding: 4rem 0; }
}
```

with:

```css
@media (min-width: 40rem) {
  h1 { font-size: 3.5rem; }
  h2 { font-size: 2.5rem; }
  .hero { padding: 6rem 0 5rem; }
  .section { padding: 5rem 0; }
}
```

Replace:

```css
@media (max-width: 30rem) {
  h1 { font-size: 1.75rem; }
}
```

with:

```css
@media (max-width: 30rem) {
  h1 { font-size: 2rem; }
}
```

- [ ] **Step 4: Append the new component CSS**

Append to the end of `src/assets/css/site.css` (after the existing `footer .disclaimer { font-size: 0.85rem; }` line):

```css

/* Dark color-block sections: hero + founder/credibility, per the
   COD-informed visual direction (bold sections, not just tint bands). */
.section--dark {
  background: var(--ink);
  color: var(--paper);
}
.section--dark h1,
.section--dark h2,
.section--dark h3 {
  color: var(--paper);
}
.section--dark p {
  color: #d7dade;
}
.section--dark .lede {
  color: #c7ccd1;
}
.section--dark a:not(.button) {
  color: var(--paper);
}

/* Hero: full-bleed photo bleeding in behind the headline, gradient-faded
   into solid --ink where the text sits (adapted from COD's hero-image
   technique — reference/clientsondemand-clone/…/index.html, .hero-image). */
.hero.section--dark {
  position: relative;
  overflow: hidden;
  min-height: 26rem;
  display: flex;
  align-items: center;
}
.hero.section--dark .hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 20%;
  z-index: 0;
}
.hero.section--dark::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, rgba(23, 32, 42, 0.35) 0%, var(--ink) 85%);
}
.hero.section--dark .wrap {
  position: relative;
  z-index: 1;
  width: 100%;
}
@media (min-width: 40rem) {
  .hero.section--dark {
    min-height: 32rem;
  }
  .hero.section--dark::after {
    background: linear-gradient(90deg, var(--ink) 0%, var(--ink) 32%, rgba(23, 32, 42, 0.25) 70%, rgba(23, 32, 42, 0) 100%);
  }
}

/* Proof/stats row (Home). */
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem 2.5rem;
  margin: 0;
}
.stats .stat {
  flex: 1 1 9rem;
}
.stats .stat-number {
  display: block;
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--accent);
}
.stats .stat-label {
  display: block;
  color: var(--muted);
  font-size: 0.9rem;
}

/* Testimonials as cards, not a single tinted quote block (Home). */
.testimonial-grid {
  display: grid;
  gap: 1.5rem;
  margin: 0;
}
@media (min-width: 40rem) {
  .testimonial-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
}
.testimonial-grid .quote {
  margin: 0;
  height: 100%;
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(23, 32, 42, 0.08);
}

/* About: story broken into named chapters instead of one dense block. */
.story-chapter {
  margin: 0 0 2.5rem;
}
.story-chapter:last-child {
  margin-bottom: 0;
}
.story-chapter h3 {
  color: var(--accent);
  margin-top: 0;
}
.story-chapter img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1rem 0 0;
}

/* About: coaching principles, small-scale version of COD's values grid. */
.values-grid {
  display: grid;
  gap: 1.5rem;
  margin: 0;
}
@media (min-width: 30rem) {
  .values-grid { grid-template-columns: 1fr 1fr; }
}
.values-grid .value {
  padding: 1.25rem;
  background: var(--paper-tint);
  border-radius: 8px;
}
.values-grid h3 {
  font-size: 1.05rem;
  margin: 0 0 0.35rem;
}
.values-grid p {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
}
```

- [ ] **Step 5: Build and check — no markup uses these classes yet, so nothing should change visually**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems` (CSS-only change, no HTML touched yet).

- [ ] **Step 6: Commit**

```bash
git add src/assets/css/site.css test/site.test.mjs
git commit -m "CSS foundation: bigger type scale, dark sections, hero photo treatment"
```

---

### Task 3: Home hero — photo + dark treatment

**Files:**
- Modify: `src/index.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: `.hero.section--dark` / `.hero-photo` CSS from Task 2; `src/assets/img/joe-ruotolo-hero.jpg` (1600×1502) from Task 1.

- [ ] **Step 1: Write the failing test**

Add to `test/site.test.mjs`:

```js
test("home hero has the hero photo on a dark section with real alt text", async () => {
  const $ = cheerio.load(await read("index.html"));
  const hero = $(".hero.section--dark");
  assert.equal(hero.length, 1, "hero is a dark section");
  const img = hero.find("img.hero-photo");
  assert.equal(img.length, 1, "hero photo present");
  assert.equal(img.attr("src"), "/assets/img/joe-ruotolo-hero.jpg");
  const alt = (img.attr("alt") || "").trim();
  assert.ok(alt.length > 5 && /Joe/.test(alt), "hero photo has real, non-empty alt text mentioning Joe");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `hero.length` is 0 (current hero has no `section--dark` class).

- [ ] **Step 3: Update the hero markup**

In `src/index.njk`, replace:

```njk
<div class="hero">
  <div class="wrap">
    <h1>For teens who know the material but freeze when it counts.</h1>
    <p class="lede">Third Mind Learning trains test prep and state management together, so pressure doesn't erase what your teen already knows.</p>
    <p><a class="button" href="/contact/">Get in touch</a></p>
  </div>
</div>
```

with:

```njk
<div class="hero section--dark">
  <img class="hero-photo" src="/assets/img/joe-ruotolo-hero.jpg" alt="Joe Ruotolo speaking on stage" width="1600" height="1502">
  <div class="wrap">
    <h1>For teens who know the material but freeze when it counts.</h1>
    <p class="lede">Third Mind Learning trains test prep and state management together, so pressure doesn't erase what your teen already knows.</p>
    <p><a class="button" href="/contact/">Get in touch</a></p>
  </div>
</div>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Full check**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems`.

- [ ] **Step 6: Commit**

```bash
git add src/index.njk test/site.test.mjs
git commit -m "Home: hero photo on dark section"
```

---

### Task 4: Home — proof/stats section

**Files:**
- Modify: `src/index.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: `.stats`/`.stat`/`.stat-number`/`.stat-label` CSS from Task 2.

- [ ] **Step 1: Write the failing test**

Add to `test/site.test.mjs`:

```js
test("home page has a stats row with three real, already-stated facts", async () => {
  const $ = cheerio.load(await read("index.html"));
  const stats = $(".stats .stat");
  assert.equal(stats.length, 3, "three stat entries");
  const numbers = stats.map((_, el) => $(el).find(".stat-number").text().trim()).get();
  assert.deepEqual(numbers, ["150+", "Certified", "SAT & ACT"]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `stats.length` is 0.

- [ ] **Step 3: Insert the stats section**

In `src/index.njk`, the problem section currently ends and the method section begins with:

```njk
    <p>It's a state. And with the right tools, states can change.</p>
    <figure class="quote">
      <blockquote>
        <p>&ldquo;The heart coherence work made a real difference. It improved my focus and helped me manage the stress and anxiety I used to feel about testing.&rdquo;</p>
      </blockquote>
      <figcaption>&mdash; Mason G, SAT Student</figcaption>
    </figure>
  </div>
</div>

<div class="section">
  <div class="wrap wrap--wide">
    <h2>Test prep for the material. State management for the pressure.</h2>
```

Replace that whole block with (this only *inserts* the new stats section between the two `</div></div>` / `<div class="section">` boundaries — the quote figure stays untouched here; it gets removed in Task 6):

```njk
    <p>It's a state. And with the right tools, states can change.</p>
    <figure class="quote">
      <blockquote>
        <p>&ldquo;The heart coherence work made a real difference. It improved my focus and helped me manage the stress and anxiety I used to feel about testing.&rdquo;</p>
      </blockquote>
      <figcaption>&mdash; Mason G, SAT Student</figcaption>
    </figure>
  </div>
</div>

<div class="section">
  <div class="wrap">
    <div class="stats">
      <div class="stat">
        <span class="stat-number">150+</span>
        <span class="stat-label">Students coached</span>
      </div>
      <div class="stat">
        <span class="stat-number">Certified</span>
        <span class="stat-label">HeartMath&reg; Trainer</span>
      </div>
      <div class="stat">
        <span class="stat-number">SAT &amp; ACT</span>
        <span class="stat-label">Test prep specialty</span>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="wrap wrap--wide">
    <h2>Test prep for the material. State management for the pressure.</h2>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Full check**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems`.

- [ ] **Step 6: Commit**

```bash
git add src/index.njk test/site.test.mjs
git commit -m "Home: proof/stats section"
```

---

### Task 5: Home founder/credibility section — dark + new photo

**Files:**
- Modify: `src/index.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: `.section--dark` CSS from Task 2; `src/assets/img/joe-ruotolo-founder.jpg` (692×900) from Task 1.

- [ ] **Step 1: Write the failing test**

Add to `test/site.test.mjs`:

```js
test("home founder section is dark and uses the founder photo", async () => {
  const $ = cheerio.load(await read("index.html"));
  const founder = $(".section--dark").filter((_, el) => $(el).find(".bio-grid").length > 0);
  assert.equal(founder.length, 1, "founder section is a dark section");
  const img = founder.find("img.bio-photo");
  assert.equal(img.attr("src"), "/assets/img/joe-ruotolo-founder.jpg");
  const alt = (img.attr("alt") || "").trim();
  assert.ok(alt.length > 2 && /Joe/.test(alt), "founder photo has real alt text mentioning Joe");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — no `.section--dark` contains `.bio-grid` yet.

- [ ] **Step 3: Update the founder section markup**

In `src/index.njk`, replace:

```njk
<div class="section section--tint">
  <div class="wrap wrap--wide">
    <h2>Who'll be in your teen's corner</h2>
    <div class="bio-grid">
      <img class="bio-photo" src="/assets/img/joe-ruotolo-speaking.jpg" alt="Joe Ruotolo speaking on stage" width="1000" height="833">
```

with:

```njk
<div class="section section--dark">
  <div class="wrap wrap--wide">
    <h2>Who'll be in your teen's corner</h2>
    <div class="bio-grid">
      <img class="bio-photo" src="/assets/img/joe-ruotolo-founder.jpg" alt="Joe Ruotolo" width="692" height="900">
```

(The rest of that section — the four `<p>` paragraphs and closing tags — is unchanged.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Full check**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems`.

- [ ] **Step 6: Commit**

```bash
git add src/index.njk test/site.test.mjs
git commit -m "Home: founder section on dark background with new photo"
```

---

### Task 6: Home — testimonials as a dedicated card grid

**Files:**
- Modify: `src/index.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: `.testimonial-grid` CSS from Task 2.

- [ ] **Step 1: Write the failing test**

Add to `test/site.test.mjs`:

```js
test("home page pulls both testimonials into one dedicated grid", async () => {
  const $ = cheerio.load(await read("index.html"));
  assert.equal($(".quote").length, 2, "exactly two testimonial quotes on the page");
  assert.equal($(".testimonial-grid .quote").length, 2, "both quotes live in the testimonial grid");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — the two quotes are still inline inside the problem/method sections, not in a `.testimonial-grid`.

- [ ] **Step 3: Remove the inline quote from the problem section**

In `src/index.njk`, replace:

```njk
    <p>It's a state. And with the right tools, states can change.</p>
    <figure class="quote">
      <blockquote>
        <p>&ldquo;The heart coherence work made a real difference. It improved my focus and helped me manage the stress and anxiety I used to feel about testing.&rdquo;</p>
      </blockquote>
      <figcaption>&mdash; Mason G, SAT Student</figcaption>
    </figure>
  </div>
</div>

<div class="section">
  <div class="wrap">
    <div class="stats">
```

with:

```njk
    <p>It's a state. And with the right tools, states can change.</p>
  </div>
</div>

<div class="section">
  <div class="wrap">
    <div class="stats">
```

- [ ] **Step 4: Remove the inline quote from the method section**

Replace:

```njk
    <p>Most students get taught one side or the other. Rarely both, together, on purpose.</p>
    <figure class="quote">
      <blockquote>
        <p>&ldquo;Your approach taught me how to actually do the math and understand why it works, instead of memorizing steps to plug into a calculator.&rdquo;</p>
      </blockquote>
      <figcaption>&mdash; SAT Student</figcaption>
    </figure>
  </div>
</div>

<div class="section section--dark">
```

with:

```njk
    <p>Most students get taught one side or the other. Rarely both, together, on purpose.</p>
  </div>
</div>

<div class="section section--dark">
```

- [ ] **Step 5: Add the testimonial grid between the founder section and the final CTA**

Replace:

```njk
        <p>Test day matters, but it was never the whole point. The skills that steady a student on test day are the ones they'll carry into every high-stakes moment after it.</p>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="wrap">
    <h2>Start with a conversation</h2>
```

with:

```njk
        <p>Test day matters, but it was never the whole point. The skills that steady a student on test day are the ones they'll carry into every high-stakes moment after it.</p>
      </div>
    </div>
  </div>
</div>

<div class="section section--tint">
  <div class="wrap">
    <h2>What students say</h2>
    <div class="testimonial-grid">
      <figure class="quote">
        <blockquote>
          <p>&ldquo;The heart coherence work made a real difference. It improved my focus and helped me manage the stress and anxiety I used to feel about testing.&rdquo;</p>
        </blockquote>
        <figcaption>&mdash; Mason G, SAT Student</figcaption>
      </figure>
      <figure class="quote">
        <blockquote>
          <p>&ldquo;Your approach taught me how to actually do the math and understand why it works, instead of memorizing steps to plug into a calculator.&rdquo;</p>
        </blockquote>
        <figcaption>&mdash; SAT Student</figcaption>
      </figure>
    </div>
  </div>
</div>

<div class="section">
  <div class="wrap">
    <h2>Start with a conversation</h2>
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Full check**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems`.

- [ ] **Step 8: Commit**

```bash
git add src/index.njk test/site.test.mjs
git commit -m "Home: testimonials as a dedicated card grid"
```

---

### Task 7: About — split the bio into story chapters

**Files:**
- Modify: `src/about.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: `.story-chapter` CSS from Task 2; `src/assets/img/joe-ruotolo-about.jpg` (1200×942) from Task 1.

- [ ] **Step 1: Write the failing test**

Add to `test/site.test.mjs`:

```js
test("about page splits the bio into four story chapters, one with a photo", async () => {
  const $ = cheerio.load(await read("about/index.html"));
  const chapters = $(".story-chapter");
  assert.equal(chapters.length, 4, "four story chapters");
  assert.equal(chapters.find("> h3").length, 4, "each chapter has its own heading");
  const img = chapters.find("img");
  assert.equal(img.length, 1, "exactly one chapter includes the about photo");
  assert.equal(img.attr("src"), "/assets/img/joe-ruotolo-about.jpg");
  const alt = (img.attr("alt") || "").trim();
  assert.ok(alt.length > 5 && /Joe/.test(alt), "about photo has real alt text mentioning Joe");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `chapters.length` is 0.

- [ ] **Step 3: Replace the bio paragraphs with story chapters**

In `src/about.njk`, replace:

```njk
<div class="section">
  <div class="wrap">
    <p>My background is physics and mathematics, then an MBA at UCLA. Along the way I became a Certified HeartMath&reg; Trainer, which is where the other half of my approach comes from: practical techniques for regulating the nervous system under pressure, not just breathing exercises, but a trainable skill in its own right.</p>
    <p>I call the practice Third Mind Learning. The name is a placeholder for a simple idea: a student under exam pressure is often fighting their own nervous system as much as the material, and until that gets addressed, more content review just adds more pressure to a system that's already overloaded.</p>
    <p>I work with students on both halves at once — the test-taking skill itself, and the ability to stay regulated long enough to use it.</p>
  </div>
</div>
```

with:

```njk
<div class="section">
  <div class="wrap">
    <h2>My story</h2>
    <div class="story-chapter">
      <h3>Where the method came from</h3>
      <p>My background is physics and mathematics, then an MBA at UCLA.</p>
      <img src="/assets/img/joe-ruotolo-about.jpg" alt="Joe Ruotolo presenting on stage" width="1200" height="942">
    </div>
    <div class="story-chapter">
      <h3>Becoming a HeartMath&reg; Trainer</h3>
      <p>Along the way I became a Certified HeartMath&reg; Trainer, which is where the other half of my approach comes from: practical techniques for regulating the nervous system under pressure, not just breathing exercises, but a trainable skill in its own right.</p>
    </div>
    <div class="story-chapter">
      <h3>Why &ldquo;Third Mind&rdquo;</h3>
      <p>I call the practice Third Mind Learning. The name is a placeholder for a simple idea: a student under exam pressure is often fighting their own nervous system as much as the material, and until that gets addressed, more content review just adds more pressure to a system that's already overloaded.</p>
    </div>
    <div class="story-chapter">
      <h3>Both halves, together</h3>
      <p>I work with students on both halves at once — the test-taking skill itself, and the ability to stay regulated long enough to use it.</p>
    </div>
  </div>
</div>
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Full check**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems`.

- [ ] **Step 6: Commit**

```bash
git add src/about.njk test/site.test.mjs
git commit -m "About: split bio into story chapters, add about photo"
```

---

### Task 8: About — values grid (placeholder content)

**Files:**
- Modify: `src/about.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: `.values-grid`/`.value` CSS from Task 2.

- [ ] **Step 1: Write the failing test**

Add to `test/site.test.mjs`:

```js
test("about page has a values grid with placeholder content flagged for Joe", async () => {
  const html = await read("about/index.html");
  const $ = cheerio.load(html);
  assert.equal($(".values-grid .value").length, 4, "four value entries");
  assert.ok(html.includes("CONTENT:"), "placeholder values are flagged with a CONTENT comment for Joe to fill in");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — `.values-grid` doesn't exist yet.

- [ ] **Step 3: Insert the values-grid section**

In `src/about.njk`, replace:

```njk
</div>

<div class="section">
  <div class="wrap">
    <p>Based in Los Angeles. All sessions are held online.</p>
```

with:

```njk
</div>

<div class="section section--tint">
  <div class="wrap">
    <h2>How I coach</h2>
    <div class="values-grid">
      <div class="value">
        <!-- CONTENT: coaching principle 1 — Joe to draft/approve -->
        <h3>Principle 1</h3>
        <p>Placeholder &mdash; one-sentence statement of this principle.</p>
      </div>
      <div class="value">
        <!-- CONTENT: coaching principle 2 — Joe to draft/approve -->
        <h3>Principle 2</h3>
        <p>Placeholder &mdash; one-sentence statement of this principle.</p>
      </div>
      <div class="value">
        <!-- CONTENT: coaching principle 3 — Joe to draft/approve -->
        <h3>Principle 3</h3>
        <p>Placeholder &mdash; one-sentence statement of this principle.</p>
      </div>
      <div class="value">
        <!-- CONTENT: coaching principle 4 — Joe to draft/approve -->
        <h3>Principle 4</h3>
        <p>Placeholder &mdash; one-sentence statement of this principle.</p>
      </div>
    </div>
  </div>
</div>

<div class="section">
  <div class="wrap">
    <p>Based in Los Angeles. All sessions are held online.</p>
```

**Note:** this is the only `replace` in the file that matches `</div>\n\n<div class="section">\n  <div class="wrap">\n    <p>Based in Los Angeles...` — confirm the match is unique before applying (it should be, since "Based in Los Angeles" appears once in the file).

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Full check**

Run: `npm run check`
Expected: `check passed — N page(s), 0 problems`.

- [ ] **Step 6: Commit**

```bash
git add src/about.njk test/site.test.mjs
git commit -m "About: values grid with placeholder content for Joe"
```

---

### Task 9: Final verification, visual QA, and push

**Files:**
- None modified (verification-only), unless visual QA turns up a fix — see Step 4.

- [ ] **Step 1: Full automated suite**

Run: `npm run check && npm test`
Expected: `check passed — N page(s), 0 problems` and all `node --test` tests green.

- [ ] **Step 2: Page-weight check (pins Review Focus #4)**

At the top of `test/site.test.mjs`, extend the existing import line:

```js
import { existsSync, readFileSync, statSync } from "node:fs";
```

(replaces the current `import { existsSync, readFileSync } from "node:fs";` on line 4 — add `statSync` to it rather than adding a second import statement for the same module.)

Then add the test itself:

```js
test("home page's local image weight stays reasonable", async () => {
  const $ = cheerio.load(await read("index.html"));
  const srcs = $("img[src^='/assets/img/']").map((_, el) => $(el).attr("src")).get();
  const totalBytes = srcs.reduce((sum, src) => {
    const path = new URL(`../_site${src}`, import.meta.url);
    return sum + statSync(path).size;
  }, 0);
  assert.ok(totalBytes < 1.5 * 1024 * 1024, `home page images total ${(totalBytes / 1024 / 1024).toFixed(2)}MB, expected < 1.5MB`);
});
```

Run: `npm test` — expected PASS given the ~57–171KB file sizes from Task 1. If it fails, an image in `scripts/prepare-redesign-images.py` needs a lower quality setting or smaller target width — re-run Task 1's Step 1–2 with adjusted numbers, not a threshold bump.

Commit this test on its own: `git add test/site.test.mjs && git commit -m "Test: home page image weight budget"`.

- [ ] **Step 3: Visual QA in a real browser (pins Review Focus #1)**

Run: `npm run dev` (leave running), then in a browser (or the claude-in-chrome tool):
1. Open `http://localhost:8080/` at desktop width (~1280px). Confirm: hero photo visible on the right, no banner text legible anywhere in it, headline readable over the dark band, stats row renders three items, founder section is dark with the new portrait, testimonial grid shows two cards side by side.
2. Resize to **~900px** (the untested mid-width from Review Focus #1). Confirm the hero gradient still fully hides the banner text at this width specifically — it was only crop-verified at full resolution, not at this rendered width.
3. Resize to mobile (~375px). Confirm hero text is legible over the photo, stats/testimonial cards stack to one column, nothing overflows horizontally.
4. Open `http://localhost:8080/about/` at desktop and mobile widths. Confirm four story chapters render with headings, the about photo appears once, and the values grid shows a 2×2 grid of clearly-placeholder content (not mistakable for real copy).
5. Eyeball contrast on both dark sections — headline/body text should read clearly against the dark background at both breakpoints (the arithmetic check in Task 2 covers the exact color pair; this step catches anything the math can't, like the gradient making part of the hero text sit over a lighter part of the photo).

- [ ] **Step 4: Fix anything Step 3 surfaces**

If the banner text is visible at the ~900px width, tighten `.hero.section--dark::after`'s gradient stops (e.g. push the solid `--ink` stop from 32% further right) in `src/assets/css/site.css`, re-run Step 3, and commit as `git commit -m "Hero: fix banner-text visibility at mid-width"`. If nothing needs fixing, skip this step — do not invent a change to have something to commit.

- [ ] **Step 5: Push the branch**

```bash
git push origin copy/cod-clone-baseline
```

- [ ] **Step 6: Update the spec's open items**

In `docs/superpowers/specs/2026-09-25-cod-reference-home-about-redesign-design.md`, under "Open items for Joe," mark the stats numbers, testimonial count, and photo placements as shipped (they were resolved during implementation using facts already present in the approved copy — no new claims were introduced). Leave the About values-grid copy open — that still needs Joe's real statements. Commit:

```bash
git add docs/superpowers/specs/2026-09-25-cod-reference-home-about-redesign-design.md
git commit -m "Spec: mark stats/testimonials/photos resolved, values copy still open"
git push origin copy/cod-clone-baseline
```
