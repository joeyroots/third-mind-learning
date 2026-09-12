# Third Mind Learning Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the technical publishing pipeline for thirdmindlearning.com — a no-CMS static site (Home, About, Program, Contact) compiled by Eleventy, deployed to Firebase Hosting via GitHub Actions, with a blocking pre-deploy check suite. Content is placeholder; real messaging is a separate follow-up project.

**Architecture:** Content lives as Nunjucks (`.njk`) files under `src/`, one file per route. Eleventy stitches in a shared header/footer/nav and writes plain HTML to `_site/`. A Node script (`scripts/check.mjs`) validates the built output (HTML validity, dead links, per-page metadata, orphan pages, leaked secrets). GitHub Actions runs build + check on every push and PR; a failing check blocks the deploy. Firebase Hosting serves `_site/` behind a global CDN with automatic TLS. PR preview channels are the staging story — there is no separate staging server. This is a direct clone of the proven `joeyroots.com` / `personal-site` pipeline.

**Tech Stack:** Node 20 LTS, Eleventy 3 (`@11ty/eleventy`), Nunjucks templating, hand-written CSS (no framework), `html-validate` + `linkinator` + `cheerio` for the check suite, Firebase Hosting, GitHub Actions (`FirebaseExtended/action-hosting-deploy`).

**Spec:** `docs/superpowers/specs/2026-09-12-third-mind-learning-pipeline-design.md` (read it alongside this plan)

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **No CMS, no database, no server runtime.** Output is plain static HTML + CSS. No client-side JS.
- **No client-side framework** (React / Vue / Astro islands). No CSS framework — CSS is hand-written.
- **SSG is Eleventy (11ty).** Node version: **20 LTS** (`engines.node` = `>=20`, `.nvmrc` = `20`).
- **Never edit `_site/`** — it is regenerated on every build and gitignored.
- **Header, footer, and nav are defined once** (`src/_includes/layouts/base.njk` + `src/_includes/partials/`). Never paste chrome markup into a page.
- **Every page has exactly one `<h1>`, a non-empty `<title>`, and a non-empty `<meta name="description">`.**
- **`npm run check` must exit 0** before any push. CI runs the identical check; a non-zero exit blocks the deploy, and production keeps its previous version.
- **`firebase.json`, `.firebaserc`, `.github/workflows/`** are infrastructure — change them deliberately, never as a side effect of a content edit.
- **Security headers on every HTML response:** `Content-Security-Policy` starting at `default-src 'self'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Caching:** static assets (css, fonts, images) → `public, max-age=31536000, immutable`; HTML → `public, max-age=600, must-revalidate`.
- **Source of truth is the GitHub repo** (`github.com/joeyroots/third-mind-learning`, already created with the spec as its first commit). The site must be fully reproducible with `npm ci && npm run build`. Nothing of value lives only on Firebase.
- **Firebase project owned by `npjruotolo@gmail.com`**, with `joe@thirdmindlearning.com` added as an IAM collaborator (per the approved design — see spec "Accounts & ownership").
- **Placeholder copy is clearly marked** with an HTML comment (`<!-- CONTENT: ... -->`) in every page's source. Replacing it with real messaging is ordinary editing under a separate follow-up project — it is **not** a task in this plan and does not block any task.

## Task / blocker overview

| Task | Deliverable | Blocked on |
|------|-------------|------------|
| 1 | Eleventy scaffold: home page, 404, CSS, shared chrome — builds locally | — |
| 2 | `/about/` page, wired into the nav | Task 1 |
| 3 | `/program/` page, wired into the nav | Task 1 |
| 4 | `/contact/` page, wired into the nav | Task 1 |
| 5 | Generated `sitemap.xml` + `robots.txt` | Task 4 |
| 6 | `scripts/check.mjs` pure check functions + unit tests | Task 1 |
| 7 | `npm run check` — full suite over `_site/`, green on the real site | Tasks 5, 6 |
| 8 | `CLAUDE.md`, `README.md`, `firebase.json` | Task 7 |
| 9 | Firebase project wired + CI workflow + first production deploy to `*.web.app` | **Joe: present to approve Firebase project creation + add joe@thirdmindlearning.com as IAM collaborator**; Task 8 |
| 10 | Custom domain live, TLS valid | **Joe: DNS access at the registrar + apex-vs-www decision**; Task 9 |
| 11 | Verified restore test, result recorded in `README.md` | Task 9 |

Tasks 1–8 are fully autonomous and produce a locally building, locally checkable site, pushed to the already-existing repo. Tasks 9–11 need Joe's presence/decisions and are written so they can run the moment those are ready.

## File structure

Created across the plan (task that introduces each file in parentheses):

```
third-mind-learning/
├── package.json                          (1)  scripts: dev, build, check, test; dependencies
├── package-lock.json                     (1)  committed lockfile
├── .nvmrc                                (1)  "20"
├── .gitignore                            (1)  _site/, node_modules/, .DS_Store
├── .eleventy.js                          (1)  Eleventy config: dirs, passthrough, navPages collection
├── CLAUDE.md                             (8)  hard rules for any Claude Code session in this repo
├── README.md                             (8)  setup, dev loop, deploy, restore-test procedure
├── firebase.json                         (8)  hosting config: public dir, clean URLs, headers
├── .firebaserc                           (9)  Firebase project alias  [infra]
├── .github/
│   └── workflows/
│       └── deploy.yml                    (9)  CI: build → check → PR preview / prod deploy → smoke  [infra]
├── docs/superpowers/
│   ├── specs/2026-09-12-third-mind-learning-pipeline-design.md   (already committed)
│   └── plans/2026-09-12-third-mind-learning-pipeline.md          (this file)
├── scripts/
│   └── check.mjs                        (6,7) build-output validation; CLI + exported pure functions
├── test/
│   ├── site.test.mjs                    (1–5) asserts on built _site/ output
│   ├── check.test.mjs                    (6)  unit tests for check.mjs pure functions
│   └── check-cli.test.mjs                (7)  runs check.mjs against fixture dirs, asserts exit code
└── src/
    ├── _data/
    │   ├── site.js                       (1)  { title, author, description, url, buildYear, buildStamp }
    │   └── nav.js                        (1)  { external: [] }
    ├── _includes/
    │   ├── layouts/
    │   │   └── base.njk                  (1)  <html> shell, <head>, header+footer includes
    │   └── partials/
    │       ├── header.njk                (1)  nav from collections.navPages + nav.external
    │       └── footer.njk                (1)  copyright line
    ├── assets/
    │   └── css/
    │       └── site.css                  (1)  hand-written placeholder stylesheet
    ├── index.njk                         (1)  → /                canonical, in nav, order 1
    ├── 404.njk                           (1)  → /404.html
    ├── about.njk                         (2)  → /about/          canonical, in nav, order 2
    ├── program.njk                       (3)  → /program/        canonical, in nav, order 3
    ├── contact.njk                       (4)  → /contact/        canonical, in nav, order 4
    ├── sitemap.njk                       (5)  → /sitemap.xml
    └── robots.njk                        (5)  → /robots.txt
```

---

## Task 1: Eleventy scaffold — home page, 404, shared chrome, CSS

**Files:**
- Create: `package.json`, `.nvmrc`, `.gitignore`, `.eleventy.js`
- Create: `src/_data/site.js`, `src/_data/nav.js`
- Create: `src/_includes/layouts/base.njk`
- Create: `src/_includes/partials/header.njk`, `src/_includes/partials/footer.njk`
- Create: `src/assets/css/site.css`
- Create: `src/index.njk`, `src/404.njk`
- Test: `test/site.test.mjs`

**Interfaces:**
- Consumes: nothing (first task). The working directory is the already-existing `third-mind-learning` repo (origin: `github.com/joeyroots/third-mind-learning`), currently containing only `docs/superpowers/specs/2026-09-12-third-mind-learning-pipeline-design.md` on `main`.
- Produces:
  - Build command `npm run build` → writes `_site/` (Eleventy default output).
  - Dev command `npm run dev` → Eleventy dev server on `http://localhost:8080`.
  - Test command `npm test` → runs `npm run build` (via `pretest`) then `node --test` over `test/`.
  - Data contract `src/_data/site.js` default export: `{ title: string, author: string, description: string, url: string, buildYear: number, buildStamp: string }`. `url` has no trailing slash and comes from `process.env.SITE_URL` with a `http://localhost:8080` fallback.
  - Data contract `src/_data/nav.js` default export: `{ external: Array<{ label: string, url: string }> }`.
  - Eleventy collection `navPages`: every content item whose data has `eleventyNavigation` and does **not** have `unlisted: true`, sorted ascending by `eleventyNavigation.order` (missing order treated as 0). Each item exposes `.url` and `.data.eleventyNavigation.key`.
  - Layout `layouts/base.njk`: expects page front-matter `title` (string) and `description` (string); optional `unlisted` (boolean) → emits the robots noindex meta; optional `mainClass` (string) → added as a class on `<main>`. Renders `header.njk`, then `<main id="main">{{ content }}</main>`, then `footer.njk`.
  - Every built HTML page contains: one `<title>`, one `<meta name="description">`, one `<link rel="canonical" href="{{site.url}}{{page.url}}">`, a `<header>` with the primary nav, a `<main id="main">`, a `<footer>`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "third-mind-learning",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "eleventy --serve --port=8080",
    "build": "eleventy",
    "check": "npm run build && node scripts/check.mjs",
    "pretest": "npm run build",
    "test": "node --test"
  },
  "dependencies": {
    "@11ty/eleventy": "^3.0.0",
    "cheerio": "^1.0.0",
    "html-validate": "^8.24.0",
    "linkinator": "^6.1.0"
  }
}
```

- [ ] **Step 2: Install dependencies and pin the lockfile**

Run: `npm install`
Expected: creates `node_modules/` and `package-lock.json`. No error.

- [ ] **Step 3: Create `.nvmrc`, `.gitignore`**

`.nvmrc`:
```
20
```

`.gitignore`:
```
node_modules/
_site/
.DS_Store
```

- [ ] **Step 4: Create `.eleventy.js`**

```js
export default function (eleventyConfig) {
  // Copy src/assets/** to _site/assets/** untouched.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/assets/css/");

  // Pages opt into the primary nav with `eleventyNavigation: { key, order }`
  // front-matter. Unlisted pages are filtered out here so they can never
  // reach the header, regardless of their front-matter.
  eleventyConfig.addCollection("navPages", (collectionApi) =>
    collectionApi
      .getAll()
      .filter((item) => item.data.eleventyNavigation && !item.data.unlisted)
      .sort(
        (a, b) =>
          (a.data.eleventyNavigation.order || 0) -
          (b.data.eleventyNavigation.order || 0),
      ),
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
```

- [ ] **Step 5: Create `src/_data/site.js` and `src/_data/nav.js`**

`src/_data/site.js`:
```js
// Site-wide values. `url` is the absolute origin with NO trailing slash;
// CI sets SITE_URL for production builds, local builds fall back to the dev server.
export default {
  title: "Third Mind Learning",
  author: "Third Mind Learning",
  description:
    "Third Mind Learning — course and education programs.",
  url: process.env.SITE_URL || "http://localhost:8080",
  buildYear: new Date().getFullYear(),
  // Cache-buster for immutably cached assets (firebase.json serves css/js/img
  // with max-age=31536000, immutable). Changes every build, so a deploy always
  // reaches returning browsers.
  buildStamp: Date.now().toString(36),
};
```

`src/_data/nav.js`:
```js
// External links appended AFTER the internal page nav. Internal pages come
// from the `navPages` collection, not from this file.
export default {
  external: [],
};
```

- [ ] **Step 6: Create the shared chrome**

`src/_includes/layouts/base.njk`:
```njk
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ title }}</title>
    <meta name="description" content="{{ description }}">
    <link rel="canonical" href="{{ site.url }}{{ page.url }}">
    {%- if unlisted %}<meta name="robots" content="noindex, nofollow">{% endif %}
    <link rel="stylesheet" href="/assets/css/site.css?v={{ site.buildStamp }}">
  </head>
  <body>
    {% include "partials/header.njk" %}
    <main id="main"{% if mainClass %} class="{{ mainClass }}"{% endif %}>
      {{ content | safe }}
    </main>
    {% include "partials/footer.njk" %}
  </body>
</html>
```

`src/_includes/partials/header.njk`:
```njk
<header>
  <a class="skip-link" href="#main">Skip to content</a>
  <nav aria-label="Primary">
    <a class="site-name" href="/">{{ site.title }}</a>
    <ul>
      {%- for entry in collections.navPages %}
      <li>
        <a href="{{ entry.url }}"{% if entry.url == page.url %} aria-current="page"{% endif %}>{{ entry.data.eleventyNavigation.key }}</a>
      </li>
      {%- endfor %}
      {%- for link in nav.external %}
      <li><a href="{{ link.url }}" rel="noopener" target="_blank">{{ link.label }}</a></li>
      {%- endfor %}
    </ul>
  </nav>
</header>
```

`src/_includes/partials/footer.njk`:
```njk
<footer>
  <p>&copy; {{ site.buildYear }} {{ site.author }}</p>
</footer>
```

- [ ] **Step 7: Create `src/assets/css/site.css`**

```css
:root {
  --measure: 42rem;
  --ink: #17202a;
  --paper: #fdfcf9;
  --muted: #5c6570;
  --accent: #2f6f5e;
  --rule: #e3e0d8;
}
* { box-sizing: border-box; }
html { font-size: 100%; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  color: var(--ink);
  background: var(--paper);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
}
main { max-width: var(--measure); margin: 0 auto; padding: 2rem 1.25rem 4rem; }
h1, h2, h3 { line-height: 1.25; }
h1 { font-size: 2rem; margin: 0 0 1rem; }
h2 { font-size: 1.35rem; margin: 2.5rem 0 0.75rem; }
h3 { font-size: 1.1rem; margin: 1.5rem 0 0.25rem; }
p { margin: 0 0 1rem; }
a { color: var(--accent); }
.lede { font-size: 1.15rem; color: var(--muted); }
.meta { color: var(--muted); font-size: 0.95rem; margin: 0 0 0.5rem; }

header {
  border-bottom: 1px solid var(--rule);
}
header nav {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem 1.5rem;
}
.site-name { font-weight: 700; text-decoration: none; color: var(--ink); }
header ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
}
header a[aria-current="page"] { font-weight: 700; text-decoration: none; }

footer {
  border-top: 1px solid var(--rule);
  color: var(--muted);
  font-size: 0.9rem;
}
footer p { max-width: var(--measure); margin: 0 auto; padding: 1.5rem 1.25rem; }

.skip-link {
  position: absolute;
  left: -9999px;
}
.skip-link:focus {
  left: 1rem;
  top: 0.5rem;
  background: var(--paper);
  padding: 0.5rem 0.75rem;
  border: 2px solid var(--accent);
}

@media (max-width: 30rem) {
  h1 { font-size: 1.6rem; }
  main { padding-top: 1.25rem; }
}
```

- [ ] **Step 8: Create `src/index.njk` and `src/404.njk`**

`src/index.njk`:
```njk
---
layout: layouts/base.njk
title: "Third Mind Learning"
description: "Third Mind Learning — course and education programs."
eleventyNavigation:
  key: Home
  order: 1
---
<!-- CONTENT: placeholder home copy. Real messaging (positioning, curriculum
     summary, offer) is a separate follow-up project — replace under the
     normal editing workflow described in CLAUDE.md. -->
<h1>Third Mind Learning</h1>
<p class="lede">Course and education programs. This site is a placeholder while the program content is finalized.</p>
<p><a href="/about/">About</a> &middot; <a href="/program/">Program</a> &middot; <a href="/contact/">Contact</a></p>
```

`src/404.njk`:
```njk
---
layout: layouts/base.njk
title: "Page not found — Third Mind Learning"
description: "The page you were looking for does not exist."
permalink: /404.html
eleventyExcludeFromCollections: true
---
<h1>Page not found</h1>
<p>That page does not exist. <a href="/">Go to the homepage.</a></p>
```

- [ ] **Step 9: Write the failing test `test/site.test.mjs`**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import * as cheerio from "cheerio";

// `npm test` runs `npm run build` first (pretest), so _site/ exists here.
const read = (p) => readFile(new URL(`../_site/${p}`, import.meta.url), "utf8");

test("home page is built with required head elements", async () => {
  assert.ok(existsSync(new URL("../_site/index.html", import.meta.url)), "_site/index.html exists");
  const $ = cheerio.load(await read("index.html"));
  assert.equal($("title").length, 1);
  assert.ok($("title").text().trim().length > 0, "non-empty <title>");
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0, "non-empty description");
  assert.equal($("h1").length, 1, "exactly one <h1>");
  assert.match($('link[rel="canonical"]').attr("href") || "", /^https?:\/\/.+\/$/);
});

test("shared chrome renders on the home page", async () => {
  const $ = cheerio.load(await read("index.html"));
  assert.equal($("header nav").length, 1, "header nav present");
  assert.equal($("main#main").length, 1, "main landmark present");
  assert.equal($("footer").length, 1, "footer present");
});

test("home page is in the primary nav", async () => {
  const $ = cheerio.load(await read("index.html"));
  const hrefs = $("header a[href]").map((_, a) => $(a).attr("href")).get();
  assert.ok(hrefs.includes("/"), "nav links to /");
});

test("404 page is built", async () => {
  assert.ok(existsSync(new URL("../_site/404.html", import.meta.url)), "_site/404.html exists");
  const $ = cheerio.load(await read("404.html"));
  assert.equal($("h1").length, 1);
});

test("stylesheet is copied through", () => {
  assert.ok(
    existsSync(new URL("../_site/assets/css/site.css", import.meta.url)),
    "_site/assets/css/site.css exists",
  );
});
```

- [ ] **Step 10: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL. Depending on how far Steps 1–8 got, either the `pretest` build errors, or assertions fail because `_site/` files are missing. (If every prior step is already done, this step instead confirms PASS — that is acceptable; the point is to see the suite exercised.)

- [ ] **Step 11: Run the build and fix until the test passes**

Run: `npm test`
Expected: PASS — all five tests green. If the build errors, read the Eleventy error (usually a template path or front-matter typo) and fix the named file.

- [ ] **Step 12: Eyeball the site**

Run: `npm run dev`
Open `http://localhost:8080/` and `http://localhost:8080/404.html`. Confirm: "Third Mind Learning" renders as an `<h1>`, the nav shows "Third Mind Learning" + "Home", the layout is centred and readable, the footer shows the year. Stop the dev server (Ctrl-C).

- [ ] **Step 13: Commit and push**

```bash
git add -A
git commit -m "feat: Eleventy scaffold with home page, 404, and shared chrome"
git push
```

---

## Task 2: About page

**Files:**
- Create: `src/about.njk`
- Modify: `test/site.test.mjs` (add about-page assertions)

**Interfaces:**
- Consumes: `layouts/base.njk` and the `navPages` collection from Task 1.
- Produces:
  - Route `/about/` from `src/about.njk`, built to `_site/about/index.html` (Eleventy's default output path for a non-index template file).
  - `/about/` carries `eleventyNavigation: { key: "About", order: 2 }` → appears in the nav after Home.

- [ ] **Step 1: Add the failing assertions to `test/site.test.mjs`**

Append:
```js
test("about page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/about/index.html", import.meta.url)),
    "_site/about/index.html exists",
  );
  const $ = cheerio.load(await read("about/index.html"));
  assert.equal($("h1").length, 1, "about has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/about/"), "home nav links to /about/");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL — `_site/about/index.html` does not exist yet.

- [ ] **Step 3: Create `src/about.njk`**

```njk
---
layout: layouts/base.njk
title: "About — Third Mind Learning"
description: "About Third Mind Learning."
eleventyNavigation:
  key: About
  order: 2
---
<!-- CONTENT: placeholder. Real "About" copy (mission, founder background,
     credibility) is a separate follow-up project. -->
<h1>About</h1>
<p>Placeholder — About page content goes here.</p>
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: PASS — all tests including the new one.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: about page wired into the nav"
git push
```

---

## Task 3: Program page

**Files:**
- Create: `src/program.njk`
- Modify: `test/site.test.mjs` (add program-page assertions)

**Interfaces:**
- Consumes: `layouts/base.njk` and the `navPages` collection from Task 1.
- Produces:
  - Route `/program/` from `src/program.njk`, built to `_site/program/index.html`.
  - `/program/` carries `eleventyNavigation: { key: "Program", order: 3 }` → appears in the nav after About.

- [ ] **Step 1: Add the failing assertions to `test/site.test.mjs`**

Append:
```js
test("program page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/program/index.html", import.meta.url)),
    "_site/program/index.html exists",
  );
  const $ = cheerio.load(await read("program/index.html"));
  assert.equal($("h1").length, 1, "program has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/program/"), "home nav links to /program/");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL — `_site/program/index.html` does not exist yet.

- [ ] **Step 3: Create `src/program.njk`**

```njk
---
layout: layouts/base.njk
title: "Program — Third Mind Learning"
description: "The Third Mind Learning program."
eleventyNavigation:
  key: Program
  order: 3
---
<!-- CONTENT: placeholder. Real curriculum/offer copy (modules, format,
     outcomes, pricing) is a separate follow-up project. -->
<h1>Program</h1>
<p>Placeholder — program/curriculum content goes here.</p>
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: program page wired into the nav"
git push
```

---

## Task 4: Contact page

**Files:**
- Create: `src/contact.njk`
- Modify: `test/site.test.mjs` (add contact-page assertions)

**Interfaces:**
- Consumes: `layouts/base.njk` and the `navPages` collection from Task 1.
- Produces:
  - Route `/contact/` from `src/contact.njk`, built to `_site/contact/index.html`.
  - `/contact/` carries `eleventyNavigation: { key: "Contact", order: 4 }` → appears in the nav after Program.

- [ ] **Step 1: Add the failing assertions to `test/site.test.mjs`**

Append:
```js
test("contact page is built and in the nav", async () => {
  assert.ok(
    existsSync(new URL("../_site/contact/index.html", import.meta.url)),
    "_site/contact/index.html exists",
  );
  const $ = cheerio.load(await read("contact/index.html"));
  assert.equal($("h1").length, 1, "contact has exactly one <h1>");
  assert.ok(($("title").text() || "").trim().length > 0);
  assert.ok(($('meta[name="description"]').attr("content") || "").trim().length > 0);

  const homeNav = cheerio
    .load(await read("index.html"))("header a[href]")
    .map((_, a) => a.attribs.href)
    .get();
  assert.ok(homeNav.includes("/contact/"), "home nav links to /contact/");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL — `_site/contact/index.html` does not exist yet.

- [ ] **Step 3: Create `src/contact.njk`**

```njk
---
layout: layouts/base.njk
title: "Contact — Third Mind Learning"
description: "Contact Third Mind Learning."
eleventyNavigation:
  key: Contact
  order: 4
---
<!-- CONTENT: placeholder. Confirm the real contact address/method as part
     of the follow-up copy project before this goes live. -->
<h1>Contact</h1>
<p>Placeholder — <a href="mailto:hello@thirdmindlearning.com">hello@thirdmindlearning.com</a></p>
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npm test`
Expected: PASS — all tests including the new one.

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: contact page wired into the nav"
git push
```

---

## Task 5: Generated sitemap.xml and robots.txt

**Files:**
- Create: `src/sitemap.njk`
- Create: `src/robots.njk`
- Modify: `test/site.test.mjs` (add sitemap/robots assertions)

**Interfaces:**
- Consumes: `site.url` (Task 1); `collections.all` (Eleventy built-in — excludes items with `eleventyExcludeFromCollections: true`).
- Produces:
  - `_site/sitemap.xml` — one `<loc>` per non-unlisted collection item, each an absolute URL `{{ site.url }}{{ item.url }}`. Excludes `/404.html`, `/sitemap.xml`, `/robots.txt` (all carry `eleventyExcludeFromCollections`).
  - `_site/robots.txt` — allows all, points at `{{ site.url }}/sitemap.xml`.

- [ ] **Step 1: Add the failing assertions to `test/site.test.mjs`**

Append:
```js
test("sitemap lists all canonical pages and excludes infra", async () => {
  assert.ok(existsSync(new URL("../_site/sitemap.xml", import.meta.url)), "sitemap.xml exists");
  const xml = await read("sitemap.xml");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const path of ["/", "/about/", "/program/", "/contact/"]) {
    assert.ok(locs.includes(path), `sitemap has ${path}`);
  }
  assert.ok(!locs.includes("/404.html"), "sitemap omits /404.html");
  assert.ok(!locs.some((p) => p.endsWith("sitemap.xml") || p.endsWith("robots.txt")), "sitemap omits infra files");
});

test("robots.txt points at the sitemap", async () => {
  assert.ok(existsSync(new URL("../_site/robots.txt", import.meta.url)), "robots.txt exists");
  const txt = await read("robots.txt");
  assert.match(txt, /Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL — `_site/sitemap.xml` and `_site/robots.txt` do not exist.

- [ ] **Step 3: Create `src/sitemap.njk`**

```njk
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{%- for item in collections.all %}
{%- if not item.data.unlisted %}
  <url><loc>{{ site.url }}{{ item.url }}</loc></url>
{%- endif %}
{%- endfor %}
</urlset>
```

- [ ] **Step 4: Create `src/robots.njk`**

```njk
---
permalink: /robots.txt
eleventyExcludeFromCollections: true
---
User-agent: *
Allow: /

Sitemap: {{ site.url }}/sitemap.xml
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Eyeball the output**

Run: `npm run build` then open `_site/sitemap.xml` and `_site/robots.txt` in an editor. Confirm exactly four `<url>` entries (`/`, `/about/`, `/program/`, `/contact/`), all absolute URLs.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "feat: generated sitemap.xml and robots.txt"
git push
```

---

## Task 6: check.mjs — pure check functions with unit tests

**Files:**
- Create: `scripts/check.mjs` (exported functions only in this task; the CLI `main()` is added in Task 7)
- Test: `test/check.test.mjs`

**Interfaces:**
- Consumes: `cheerio` (installed in Task 1).
- Produces (all named exports of `scripts/check.mjs`):
  - `checkMetadata(html: string): string[]` — returns a list of problem strings. Flags: not exactly one `<title>`, empty title, missing/empty `<meta name="description">`, not exactly one `<h1>`, missing `<link rel="canonical">` or a canonical whose value is not an absolute `http(s)://` URL. Empty array = clean.
  - `isNoindex(html: string): boolean` — true if a `<meta name="robots">` content contains `noindex` (case-insensitive).
  - `navHrefs(html: string): string[]` — every `href` of an `<a>` inside `<header>`.
  - `checkSecrets(text: string): string[]` — returns a problem string per matched pattern in `SECRET_PATTERNS`. Empty array = clean.
  - `sourceFrontMatter(fileText: string): { unlisted: boolean, permalink: string | null }` — parses the leading `---`…`---` block; `unlisted` true iff a line matches `/^\s*unlisted:\s*true\s*$/m`; `permalink` is the captured value of `/^\s*permalink:\s*(\S+)\s*$/m` or `null`. (No page in this site sets `unlisted: true` yet — this keeps the check suite ready for one without requiring it.)
  - `fileToUrl(siteRelPath: string): string` — maps a path relative to the site output dir to a URL path: `"index.html"` → `"/"`, `"about/index.html"` → `"/about/"`, `"404.html"` → `"/404.html"`. Input always uses `/` separators.

- [ ] **Step 1: Write `test/check.test.mjs` (failing — module does not exist yet)**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  checkMetadata,
  isNoindex,
  navHrefs,
  checkSecrets,
  sourceFrontMatter,
  fileToUrl,
} from "../scripts/check.mjs";

const GOOD = `<!doctype html><html><head>
<title>T</title><meta name="description" content="d">
<link rel="canonical" href="https://example.com/x/"></head>
<body><header><a href="/">H</a><a href="/about/">A</a></header><main><h1>One</h1></main></body></html>`;

test("checkMetadata passes a well-formed page", () => {
  assert.deepEqual(checkMetadata(GOOD), []);
});

test("checkMetadata flags missing description, extra h1, bad canonical", () => {
  const bad = `<html><head><title>T</title>
  <link rel="canonical" href="/relative/"></head>
  <body><h1>a</h1><h1>b</h1></body></html>`;
  const errs = checkMetadata(bad).join(" | ");
  assert.match(errs, /description/);
  assert.match(errs, /h1/);
  assert.match(errs, /canonical/);
});

test("checkMetadata flags an empty title", () => {
  const bad = GOOD.replace("<title>T</title>", "<title>   </title>");
  assert.ok(checkMetadata(bad).some((e) => /title/.test(e)));
});

test("isNoindex detects the robots meta", () => {
  assert.equal(isNoindex(GOOD), false);
  assert.equal(
    isNoindex(GOOD.replace("</head>", '<meta name="robots" content="NOINDEX, nofollow"></head>')),
    true,
  );
});

test("navHrefs returns only header anchors", () => {
  assert.deepEqual(navHrefs(GOOD), ["/", "/about/"]);
});

test("checkSecrets catches a private key header and a Google key", () => {
  assert.ok(checkSecrets("x -----BEGIN PRIVATE KEY----- y").length >= 1);
  assert.ok(checkSecrets("key=AIza0123456789012345678901234567890123").length >= 1);
  assert.deepEqual(checkSecrets("nothing to see"), []);
});

test("sourceFrontMatter parses unlisted and permalink", () => {
  const fm = `---\nlayout: x\npermalink: /hidden/\nunlisted: true\n---\n<h1>x</h1>`;
  assert.deepEqual(sourceFrontMatter(fm), { unlisted: true, permalink: "/hidden/" });
  assert.deepEqual(sourceFrontMatter("no front matter"), { unlisted: false, permalink: null });
});

test("fileToUrl maps output paths to URL paths", () => {
  assert.equal(fileToUrl("index.html"), "/");
  assert.equal(fileToUrl("about/index.html"), "/about/");
  assert.equal(fileToUrl("404.html"), "/404.html");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test test/check.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/check.mjs'`.

- [ ] **Step 3: Write `scripts/check.mjs` (exports only)**

```js
import * as cheerio from "cheerio";

export const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
  /-----BEGIN CERTIFICATE-----/,
  /AIza[0-9A-Za-z_-]{35}/, // Google API key
  /AKIA[0-9A-Z]{16}/, // AWS access key id
  /ghp_[0-9A-Za-z]{36}/, // GitHub personal access token
  /"private_key"\s*:\s*"-----BEGIN/, // service-account JSON
];

export function checkMetadata(html) {
  const $ = cheerio.load(html);
  const errs = [];
  const titles = $("title");
  if (titles.length !== 1) errs.push(`expected exactly one <title>, found ${titles.length}`);
  else if (!titles.first().text().trim()) errs.push("empty <title>");
  const desc = $('meta[name="description"]').attr("content");
  if (!desc || !desc.trim()) errs.push("missing or empty <meta name=description>");
  const h1s = $("h1").length;
  if (h1s !== 1) errs.push(`expected exactly one <h1>, found ${h1s}`);
  const canon = $('link[rel="canonical"]').attr("href");
  if (!canon) errs.push("missing <link rel=canonical>");
  else if (!/^https?:\/\/.+/.test(canon)) errs.push(`<link rel=canonical> is not an absolute URL: ${canon}`);
  return errs;
}

export function isNoindex(html) {
  const $ = cheerio.load(html);
  return ($('meta[name="robots"]').attr("content") || "").toLowerCase().includes("noindex");
}

export function navHrefs(html) {
  const $ = cheerio.load(html);
  return $("header a[href]").map((_, a) => $(a).attr("href")).get();
}

export function checkSecrets(text) {
  return SECRET_PATTERNS.filter((re) => re.test(text)).map((re) => `possible secret matching ${re}`);
}

export function sourceFrontMatter(fileText) {
  const m = fileText.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = m ? m[1] : "";
  const permalinkMatch = fm.match(/^\s*permalink:\s*(\S+)\s*$/m);
  return {
    unlisted: /^\s*unlisted:\s*true\s*$/m.test(fm),
    permalink: permalinkMatch ? permalinkMatch[1] : null,
  };
}

export function fileToUrl(siteRelPath) {
  const p = siteRelPath.replace(/\\/g, "/");
  if (p === "404.html") return "/404.html";
  return "/" + p.replace(/index\.html$/, "");
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --test test/check.test.mjs`
Expected: PASS — all check-function tests green.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS — `test/site.test.mjs` and `test/check.test.mjs` both green.

- [ ] **Step 6: Commit and push**

```bash
git add -A
git commit -m "feat: check.mjs pure validation functions with unit tests"
git push
```

---

## Task 7: check.mjs CLI — full suite over the built site, wired to `npm run check`

**Files:**
- Modify: `scripts/check.mjs` (add imports, `walk`, `main()`, CLI entrypoint)
- Create: `test/check-cli.test.mjs`

**Interfaces:**
- Consumes: every export from Task 6; `html-validate`, `linkinator` (installed Task 1); the built `_site/` (Tasks 1–5) and `src/` tree.
- Produces:
  - `node scripts/check.mjs` — runs the full suite and exits `0` (clean) or `1` (one or more problems, each printed as `  ✗ <message>`).
  - Env overrides for testing: `CHECK_SITE_DIR` (default `_site`), `CHECK_SRC_DIR` (default `src`).
  - `npm run check` = `npm run build && node scripts/check.mjs` (script already defined in Task 1).
  - Aggregated checks: (a) `html-validate` recommended ruleset over every `*.html`; (b) `checkMetadata` per HTML page; (c) `checkSecrets` over every `*.html`, `*.xml`, `*.txt`, `*.css`, `*.js` in the output; (d) unlisted guarantee — for every `src/**/*.njk` with `unlisted: true`: it must declare a `permalink`, the built page at that permalink must be `isNoindex`, and that URL must appear in neither `sitemap.xml` nor any page's `navHrefs` (no page currently sets this, so this check is a no-op until one does); (e) any `isNoindex` page must likewise be absent from `sitemap.xml` and all navs; (f) orphan check — every non-noindex HTML page except `/404.html` must appear in the nav or the sitemap; (g) `linkinator` recursive crawl of `_site/`, reporting `BROKEN` links, skipping `linkedin.com`, `localhost:8080`, `example.com`, and (when `SITE_URL` is set) the production origin.

- [ ] **Step 1: Write `test/check-cli.test.mjs` (failing — `main` not wired yet)**

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const SCRIPT = new URL("../scripts/check.mjs", import.meta.url).pathname;

async function scaffold() {
  const root = await mkdtemp(join(tmpdir(), "check-"));
  const site = join(root, "site");
  const src = join(root, "src");
  await mkdir(join(site, "hidden"), { recursive: true });
  await mkdir(src, { recursive: true });
  return { root, site, src };
}

const page = (opts = {}) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><title>${opts.title ?? "Title"}</title>
<meta name="description" content="${opts.desc ?? "desc"}">
<link rel="canonical" href="https://example.com${opts.url ?? "/"}">
${opts.noindex ? '<meta name="robots" content="noindex, nofollow">' : ""}
</head><body><header><nav>${(opts.nav ?? ["/"]).map((h) => `<a href="${h}">x</a>`).join("")}</nav></header>
<main><h1>${opts.h1 ?? "One"}</h1>${opts.body ?? ""}</main><footer>f</footer></body></html>`;

const sitemap = (paths) =>
  `<?xml version="1.0"?><urlset>${paths.map((p) => `<url><loc>https://example.com${p}</loc></url>`).join("")}</urlset>`;

async function checkExit(site, src) {
  try {
    await run("node", [SCRIPT], { env: { ...process.env, CHECK_SITE_DIR: site, CHECK_SRC_DIR: src } });
    return 0;
  } catch (e) {
    return e.code ?? 1;
  }
}

test("clean fixture passes", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/", "/about/"] }));
  await mkdir(join(site, "about"), { recursive: true });
  await writeFile(join(site, "about", "index.html"), page({ url: "/about/", nav: ["/", "/about/"] }));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/", "/about/"]));
  await writeFile(join(site, "robots.txt"), "User-agent: *\nAllow: /\n");
  assert.equal(await checkExit(site, src), 0);
  await rm(root, { recursive: true, force: true });
});

test("missing description fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"),
    page({ url: "/", nav: ["/"] }).replace(/<meta name="description"[^>]*>/, ""));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/"]));
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});

test("unlisted page leaking into the sitemap fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/"] }));
  await writeFile(join(site, "hidden", "index.html"),
    page({ url: "/hidden/", nav: ["/"], noindex: true }));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/", "/hidden/"]));
  await writeFile(join(src, "hidden.njk"),
    "---\npermalink: /hidden/\nunlisted: true\n---\n<h1>x</h1>");
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});

test("unlisted source without a built noindex page fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/"] }));
  await writeFile(join(site, "hidden", "index.html"),
    page({ url: "/hidden/", nav: ["/"] })); // NOT noindex
  await writeFile(join(site, "sitemap.xml"), sitemap(["/"]));
  await writeFile(join(src, "hidden.njk"),
    "---\npermalink: /hidden/\nunlisted: true\n---\n<h1>x</h1>");
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});

test("orphan canonical page fails", async () => {
  const { root, site, src } = await scaffold();
  await writeFile(join(site, "index.html"), page({ url: "/", nav: ["/"] }));
  await mkdir(join(site, "lonely"), { recursive: true });
  await writeFile(join(site, "lonely", "index.html"), page({ url: "/lonely/", nav: ["/"] }));
  await writeFile(join(site, "sitemap.xml"), sitemap(["/"])); // /lonely/ in neither nav nor sitemap
  assert.equal(await checkExit(site, src), 1);
  await rm(root, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test test/check-cli.test.mjs`
Expected: FAIL — `check.mjs` has no `main()`, so it exits 0 and does nothing; the "should fail" cases return 0.

- [ ] **Step 3: Add imports and a `walk` helper to `scripts/check.mjs`**

At the top, after the `cheerio` import:
```js
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { HtmlValidate } from "html-validate";
import { LinkChecker } from "linkinator";

const SITE_DIR = process.env.CHECK_SITE_DIR || "_site";
const SRC_DIR = process.env.CHECK_SRC_DIR || "src";

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}
```

- [ ] **Step 4: Append `main()` and the CLI entrypoint to `scripts/check.mjs`**

```js
async function main() {
  const problems = [];
  const allFiles = await walk(SITE_DIR);
  const htmlFiles = allFiles.filter((f) => f.endsWith(".html"));

  if (htmlFiles.length === 0) {
    console.error(`check failed — no HTML files under ${SITE_DIR}/ (did the build run?)`);
    process.exit(1);
  }

  // (a) html-validate
  const htmlvalidate = new HtmlValidate({ extends: ["html-validate:recommended"] });
  for (const f of htmlFiles) {
    const report = await htmlvalidate.validateFile(f);
    if (!report.valid) {
      for (const r of report.results) {
        for (const msg of r.messages) {
          problems.push(`${fileToUrl(relative(SITE_DIR, f).replace(/\\/g, "/"))}: ${msg.ruleId} — ${msg.message} (line ${msg.line})`);
        }
      }
    }
  }

  // (b)(c) per-page metadata + secret scan; collect noindex URLs and nav links
  const noindexUrls = new Set();
  const navLinks = new Set();
  const pageUrls = [];
  for (const f of htmlFiles) {
    const html = await readFile(f, "utf8");
    const url = fileToUrl(relative(SITE_DIR, f).replace(/\\/g, "/"));
    pageUrls.push(url);
    for (const e of checkMetadata(html)) problems.push(`${url}: ${e}`);
    for (const e of checkSecrets(html)) problems.push(`${url}: ${e}`);
    if (isNoindex(html)) noindexUrls.add(url);
    for (const h of navHrefs(html)) navLinks.add(h);
  }
  for (const f of allFiles.filter((f) => /\.(xml|txt|css|js|json)$/.test(f))) {
    for (const e of checkSecrets(await readFile(f, "utf8"))) {
      problems.push(`${relative(SITE_DIR, f).replace(/\\/g, "/")}: ${e}`);
    }
  }

  // sitemap URLs
  let sitemapPaths = new Set();
  try {
    const xml = await readFile(join(SITE_DIR, "sitemap.xml"), "utf8");
    sitemapPaths = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));
  } catch {
    problems.push("sitemap.xml: not found in build output");
  }

  // (d) unlisted guarantee, driven by source front-matter
  const srcNjk = (await walk(SRC_DIR)).filter((f) => f.endsWith(".njk"));
  for (const f of srcNjk) {
    const { unlisted, permalink } = sourceFrontMatter(await readFile(f, "utf8"));
    if (!unlisted) continue;
    const rel = relative(SRC_DIR, f).replace(/\\/g, "/");
    if (!permalink) {
      problems.push(`${rel}: unlisted page must set an explicit permalink`);
      continue;
    }
    if (!noindexUrls.has(permalink)) problems.push(`${permalink}: unlisted source, but built page is missing <meta robots noindex>`);
    if (sitemapPaths.has(permalink)) problems.push(`${permalink}: unlisted page appears in sitemap.xml`);
    if (navLinks.has(permalink)) problems.push(`${permalink}: unlisted page is linked from a page nav`);
  }

  // (e) any noindex page must not be advertised
  for (const url of noindexUrls) {
    if (sitemapPaths.has(url)) problems.push(`${url}: noindex page appears in sitemap.xml`);
    if (navLinks.has(url)) problems.push(`${url}: noindex page is linked from a page nav`);
  }

  // (f) orphan check
  for (const url of pageUrls) {
    if (url === "/404.html" || noindexUrls.has(url)) continue;
    if (!navLinks.has(url) && !sitemapPaths.has(url)) {
      problems.push(`${url}: canonical page is in neither the nav nor the sitemap (orphan)`);
    }
  }

  // (g) broken links
  // localhost:8080 is the canonical-URL fallback for local builds (src/_data/site.js);
  // the dev server is not running during a check, so those self-links must be skipped.
  // example.com is the reserved documentation domain used by test fixtures;
  // skipping it keeps the fixture tests hermetic (no live-network dependency).
  const skip = ["linkedin\\.com", "localhost:8080", "example\\.com"];
  if (process.env.SITE_URL) {
    skip.push(process.env.SITE_URL.replace(/^https?:\/\//, "").replace(/\./g, "\\."));
  }
  const checker = new LinkChecker();
  const result = await checker.check({ path: SITE_DIR, recurse: true, linksToSkip: skip });
  for (const link of result.links) {
    if (link.state === "BROKEN") problems.push(`broken link: ${link.url} (referenced from ${link.parent})`);
  }

  if (problems.length) {
    console.error(`\ncheck failed — ${problems.length} problem(s):\n`);
    for (const p of problems) console.error("  ✗ " + p);
    process.exit(1);
  }
  console.log(`check passed — ${htmlFiles.length} page(s), 0 problems`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

- [ ] **Step 5: Run the CLI test and verify it passes**

Run: `node --test test/check-cli.test.mjs`
Expected: PASS — all five fixture cases behave as asserted.

- [ ] **Step 6: Run `npm run check` against the real site**

Run: `npm run check`
Expected: PASS — `check passed — 5 page(s), 0 problems` (index, about, program, contact, 404, plus none of the infra files count as HTML). If it fails, read each `✗` line — it names the exact file/URL and rule.

- [ ] **Step 7: Run the whole test suite**

Run: `npm test`
Expected: PASS — all three test files green.

- [ ] **Step 8: Commit and push**

```bash
git add -A
git commit -m "feat: check.mjs CLI wired to npm run check"
git push
```

---

## Task 8: Project docs and Firebase hosting config

**Files:**
- Create: `CLAUDE.md`
- Create: `README.md`
- Create: `firebase.json`
- Modify: `test/site.test.mjs` (add a `firebase.json` shape assertion)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `firebase.json` — valid JSON with `hosting.public === "_site"`, `hosting.cleanUrls === true`, `hosting.trailingSlash === true`, a `headers` entry applying the security headers to every path (`source: "**"`, required because `cleanUrls` means `/about/` never matches a `**/*.html` glob), and a long-cache entry for static asset extensions. `hosting.redirects` is an empty array (the canonical-host redirect, if any, is added in Task 10).
  - `CLAUDE.md` — the hard rules, so any Claude Code session in this repo picks them up.
  - `README.md` — setup, the dev loop, how deploys work, and the restore-test procedure (Task 11 fills in the "last verified" line).

- [ ] **Step 1: Add the failing assertion to `test/site.test.mjs`**

Append:
```js
import { readFileSync } from "node:fs";

test("firebase.json is valid and has the required hosting config", () => {
  const cfg = JSON.parse(readFileSync(new URL("../firebase.json", import.meta.url), "utf8"));
  assert.equal(cfg.hosting.public, "_site");
  assert.equal(cfg.hosting.cleanUrls, true);
  assert.equal(cfg.hosting.trailingSlash, true);
  // Security headers must sit on a source that matches clean URLs (e.g. "**");
  // "**/*.html" never matches "/about/" when cleanUrls is on.
  const htmlHeaders = cfg.hosting.headers.find((h) =>
    h.headers.some((x) => x.key.toLowerCase() === "content-security-policy"),
  );
  assert.equal(htmlHeaders.source, "**", "security headers apply to every request path");
  const keys = htmlHeaders.headers.map((h) => h.key.toLowerCase());
  for (const required of [
    "content-security-policy",
    "x-content-type-options",
    "referrer-policy",
    "strict-transport-security",
  ]) {
    assert.ok(keys.includes(required), `html headers include ${required}`);
  }
  assert.ok(cfg.hosting.headers.some((h) => /max-age=31536000/.test(JSON.stringify(h))), "a long-cache header exists");
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test`
Expected: FAIL — `firebase.json` does not exist.

- [ ] **Step 3: Create `firebase.json`**

```json
{
  "hosting": {
    "public": "_site",
    "cleanUrls": true,
    "trailingSlash": true,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=600, must-revalidate" },
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests"
          },
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
          { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
        ]
      },
      {
        "source": "**/*.@(js|css|woff|woff2|ttf|otf|eot|png|jpg|jpeg|gif|svg|webp|avif|ico)",
        "headers": [
          { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
        ]
      }
    ],
    "redirects": []
  }
}
```

- [ ] **Step 4: Create `CLAUDE.md`**

```markdown
# Working in this repo

Third Mind Learning marketing site. No CMS. Content is authored as `.njk`
files under `src/`, compiled by Eleventy to plain static HTML in `_site/`,
deployed to Firebase Hosting via GitHub Actions.

## Hard rules

- Edit files under `src/`. **Never edit `_site/`** — it is regenerated on every
  build and is gitignored.
- The header, footer, and nav live only in `src/_includes/layouts/base.njk` and
  `src/_includes/partials/`. Never paste chrome markup into a page.
- Every page sets `title` and `description` front-matter and has exactly one
  `<h1>`.
- A page that should exist but stay undiscoverable sets BOTH `unlisted: true`
  AND an explicit `permalink:` in front-matter. That gives it `noindex`, keeps
  it out of `sitemap.xml`, and keeps it out of the nav. The check suite
  enforces all three. (No page currently uses this.)
- Run `npm run check` before every push. It must print `0 problems`. When it
  fails, fix the cause in `src/`, not the check.
- `firebase.json`, `.firebaserc`, and `.github/workflows/` are infrastructure.
  Change them deliberately, never as a side effect of a content edit.
- Placeholder content is marked with `<!-- CONTENT: ... -->` comments. Real
  page copy (positioning, curriculum, offer) is a separate project — do not
  invent finished messaging while doing infrastructure work.

## Commands

- `npm run dev`   — Eleventy dev server at http://localhost:8080
- `npm run build` — write `_site/`
- `npm run check` — build, then run the full validation suite
- `npm test`      — build, then run the unit + output tests

## Editing loop

1. `npm run dev` in one terminal.
2. Make the change in `src/`. Keep the diff small and scoped.
3. Look at the page at desktop and phone width.
4. `npm run check` — must pass.
5. Commit, push a branch, open a PR. CI posts a preview URL. Look at it.
6. Merge → CI deploys to production.
```

- [ ] **Step 5: Create `README.md`**

```markdown
# third-mind-learning

Marketing site for Third Mind Learning. Eleventy → static HTML → Firebase Hosting.

## Requirements

- Node 20 (`nvm use` reads `.nvmrc`)

## Setup

```bash
npm ci
npm run dev      # http://localhost:8080
```

## Scripts

| command | what it does |
|---------|--------------|
| `npm run dev`   | Eleventy dev server with live reload |
| `npm run build` | compile `src/` → `_site/` |
| `npm run check` | build, then validate the output (HTML, links, metadata, orphans, secrets) |
| `npm test`      | build, then run the test suite |

## Deploying

Push to a branch and open a PR against `main`. GitHub Actions builds, runs
`npm run check`, and deploys a preview channel; the preview URL is commented on
the PR. Merging to `main` deploys production. A failing check blocks the deploy
and production keeps its previous version.

## Content

Pages are `.njk` files under `src/`, one per route. Shared header/footer/nav are
in `src/_includes/`. See `CLAUDE.md` for the rules that keep the check suite
green. Current pages ship with placeholder copy (`<!-- CONTENT: ... -->`
comments mark where) — real messaging is a separate follow-up project.

## Backup / restore test

The GitHub repo is the source of truth. The site is fully reproducible from it.

To verify (run periodically):

```bash
cd "$(mktemp -d)"
git clone https://github.com/joeyroots/third-mind-learning.git third-mind-learning && cd third-mind-learning
npm ci
npm run build
npm run check
```

`npm run check` printing `0 problems` on a clean clone is the pass condition.

**Last verified:** _(not yet run — see plan Task 11)_
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npm test`
Expected: PASS — including the new `firebase.json` assertion.

- [ ] **Step 7: Commit and push**

```bash
git add -A
git commit -m "docs: CLAUDE.md, README.md, and Firebase hosting config"
git push
```

---

## Task 9: Firebase wiring and CI — BLOCKED ON: Joe present to approve project creation

**Prerequisites:**
- Firebase CLI is already installed and authenticated as `npjruotolo@gmail.com` (confirmed during brainstorming) — no login step needed.
- `gh` CLI is already authenticated as the `joeyroots` GitHub account — no login step needed.
- Joe present at Steps 1 and 3 below: creating a billing-relevant GCP/Firebase project, and adding a second account as a collaborator, are account-level actions the design says should not happen silently.

**Files:**
- Create: `.firebaserc`
- Create: `.github/workflows/deploy.yml`
- Modify: `firebase.json` only if `firebase init` rewrites it (see Step 2 — preserve the Task 8 `headers` block)

**Interfaces:**
- Consumes: the pushed repo (Tasks 1–8); `firebase.json` (Task 8); `npm run build`, `node scripts/check.mjs` (Tasks 1–7).
- Produces:
  - A new Firebase project, on the free **Spark** plan, owned by `npjruotolo@gmail.com`, with `joe@thirdmindlearning.com` added as a project member (Editor or Firebase Admin role).
  - `.firebaserc` mapping `default` → the Firebase project id.
  - A GitHub Actions secret (name generated by `firebase init hosting:github`, of the form `FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID_UPPER_SNAKE>`).
  - GitHub Actions **variables** `SITE_URL` (production origin) and `PROD_URL` (URL the smoke test curls). Until Task 10, both = the Firebase default URL `https://<project-id>.web.app`.
  - `.github/workflows/deploy.yml`: on PR → build, check, deploy a 7-day preview channel (URL auto-commented). On push to `main` → build, check, deploy to the `live` channel, then curl the production URL for `200` + the marker string `Third Mind Learning`. A failing `npm run build` or check fails the job before any deploy step.
  - First production deploy live at `https://<project-id>.web.app`.

- [ ] **Step 1: Create the Firebase project (with Joe)**

Run:
```bash
firebase projects:create third-mind-learning --display-name "Third Mind Learning"
```
Expected: prints the created project id. If `third-mind-learning` is already taken globally, Firebase errors — retry with a short random suffix, e.g. `firebase projects:create third-mind-learning-4821 --display-name "Third Mind Learning"`, and use whatever id was actually accepted in every step below (including `.firebaserc` and `deploy.yml`). Confirm the **Spark** (free) plan applies by default — no billing account is attached at this step.

- [ ] **Step 2: Add `joe@thirdmindlearning.com` as a project member (Joe does this step)**

In the Firebase console (console.firebase.google.com) → the new project → gear icon → **Users and permissions** → Add member → `joe@thirdmindlearning.com` → role **Editor**. This is a console action tied to a specific Google identity — Joe completes it directly rather than the CLI.

- [ ] **Step 3: Create `.firebaserc`**

```json
{
  "projects": {
    "default": "third-mind-learning"
  }
}
```
(Use the real project id from Step 1 if different.)

- [ ] **Step 4: Initialise Firebase Hosting without clobbering `firebase.json`**

`firebase init hosting` will offer to overwrite `firebase.json`. Decline overwriting the file, or run it and then restore the Task 8 `firebase.json` from git (`git checkout firebase.json`) — keep only the `.firebaserc` and any `.gitignore` additions it makes. Confirm afterwards:
- `firebase.json` still has the full `headers` block from Task 8.
- `firebase.json` `hosting.public` is `_site`.

Run: `npx firebase deploy --only hosting`
Expected: first manual deploy succeeds; note the `Hosting URL` (`https://<project-id>.web.app`). Open it — the site renders.

- [ ] **Step 5: Generate the CI service account and secret**

Run: `npx firebase init hosting:github`
Answer: the repo is `joeyroots/third-mind-learning`; set up automatic deploys on merge → yes; the build script it asks for → `npm ci && npm run build` (the workflow file it writes is replaced in Step 6, but this step creates the Firebase service-account secret and grants it deploy rights).

Run: `gh secret list`
Expected: a secret named `FIREBASE_SERVICE_ACCOUNT_<PROJECT_ID_UPPER_SNAKE>` (e.g. `FIREBASE_SERVICE_ACCOUNT_THIRD_MIND_LEARNING`). Note the exact printed name — it is used literally in Step 6.

- [ ] **Step 6: Replace `.github/workflows/` contents with `deploy.yml`**

Delete any workflow files `firebase init` created under `.github/workflows/`, then create `.github/workflows/deploy.yml` (substitute the real project id and the exact secret name from Step 5 wherever shown):

```yaml
name: deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
permissions:
  contents: read
  pull-requests: write
  checks: write
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true
jobs:
  build-check-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          SITE_URL: ${{ vars.SITE_URL }}
      - run: node scripts/check.mjs
        env:
          SITE_URL: ${{ vars.SITE_URL }}
      - name: Deploy preview channel (PR)
        if: github.event_name == 'pull_request'
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_THIRD_MIND_LEARNING }}
          projectId: third-mind-learning
          expires: 7d
      - name: Deploy production (main)
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_THIRD_MIND_LEARNING }}
          projectId: third-mind-learning
          channelId: live
      - name: Smoke test production
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: |
          sleep 15
          url="${{ vars.PROD_URL }}"
          code=$(curl -sS -o /tmp/body -w '%{http_code}' "$url")
          echo "HTTP $code for $url"
          test "$code" = "200" || { echo "expected 200"; exit 1; }
          grep -q "Third Mind Learning" /tmp/body || { echo "marker string 'Third Mind Learning' missing"; exit 1; }
```

- [ ] **Step 7: Set the CI variables**

Run:
```bash
gh variable set SITE_URL --body "https://third-mind-learning.web.app"
gh variable set PROD_URL --body "https://third-mind-learning.web.app"
```
(Real project id if different. Both change to the custom domain in Task 10.)

- [ ] **Step 8: Ship the workflow via a PR (proves the whole pipeline)**

```bash
git checkout -b ci-pipeline
git add .firebaserc .github/workflows/deploy.yml firebase.json .gitignore
git commit -m "ci: build + check + Firebase preview/production deploy"
git push -u origin ci-pipeline
gh pr create --fill --base main
```
Expected: the PR's Actions run builds, runs `check`, deploys a preview channel, and comments a `https://third-mind-learning--ci-pipeline-<hash>.web.app` URL. Open it and confirm the site renders.

- [ ] **Step 9: Merge and confirm production**

```bash
gh pr merge ci-pipeline --squash --delete-branch
```
Expected: the `main` run builds, checks, deploys `live`, and the smoke step reports `HTTP 200` with the marker present. Open `https://third-mind-learning.web.app` (or the real project id) and confirm.

- [ ] **Step 10: Set light branch protection**

Run:
```bash
gh api -X PUT repos/joeyroots/third-mind-learning/branches/main/protection \
  -F required_pull_request_reviews.required_approving_review_count=0 \
  -F enforce_admins=false \
  -F required_status_checks.strict=true \
  -F 'required_status_checks.contexts[]=build-check-deploy' \
  -F restrictions=
```
Expected: `main` now requires the CI check to pass before merge.

---

## Task 10: Custom domain — BLOCKED ON: Joe's DNS access + apex/www decision

**Prerequisites (Joe):**
- Login to wherever `thirdmindlearning.com`'s DNS is managed (registrar or DNS host), able to add `A` and `TXT` records.
- Decision: canonical host is the apex (`thirdmindlearning.com`) or `www` (`www.thirdmindlearning.com`). Plan assumes **apex canonical**; if `www`, swap the two hostnames in Steps 3–4.

**Files:**
- Modify: `firebase.json` (add the canonical-host 301 redirect, if `www` is kept reachable)

**Interfaces:**
- Consumes: the live Firebase site (Task 9).
- Produces:
  - Both `thirdmindlearning.com` and `www.thirdmindlearning.com` connected in Firebase Hosting, TLS provisioned.
  - `firebase.json` `hosting.redirects` sends the non-canonical host to the canonical one with `type: 301`.
  - CI variables `SITE_URL` and `PROD_URL` updated to `https://thirdmindlearning.com`.
  - `sitemap.xml`, `robots.txt`, and every `<link rel=canonical>` now emit the real domain (they read `site.url`, which reads `SITE_URL`).

- [ ] **Step 1: Add both hostnames in the Firebase console**

Firebase console → Hosting → Add custom domain → `thirdmindlearning.com`. Repeat for `www.thirdmindlearning.com`. Firebase shows, per hostname, a `TXT` verification record and one or two `A` records (IPs `199.36.158.100` / `199.36.158.99`).

- [ ] **Step 2: Add the DNS records at the registrar (Joe)**

Add the `TXT` verification record(s) and the `A` record(s) exactly as shown. If the apex cannot hold `A` records at that host, use the host's ALIAS/ANAME/flattened-CNAME feature to the target Firebase shows. Save.

- [ ] **Step 3: Wait for verification and TLS**

In the Firebase console, both domains move to "Connected" once DNS propagates and the certificate provisions (typically 15–60 min, can be longer). Verify from a terminal:
```bash
dig +short thirdmindlearning.com
curl -sSI https://thirdmindlearning.com | head -n 1
curl -sSI https://www.thirdmindlearning.com | head -n 1
```
Expected: `A` records resolve to the Firebase IPs; both URLs return `HTTP/2 200` (or a redirect once Step 4 lands).

- [ ] **Step 4: Add the canonical-host redirect to `firebase.json`**

Set `hosting.redirects` (apex canonical shown):
```json
"redirects": [
  {
    "source": "https://www.thirdmindlearning.com/**",
    "destination": "https://thirdmindlearning.com/:splat",
    "type": 301
  }
]
```

- [ ] **Step 5: Point the site's own URL at the domain**

Run:
```bash
gh variable set SITE_URL --body "https://thirdmindlearning.com"
gh variable set PROD_URL --body "https://thirdmindlearning.com"
```

- [ ] **Step 6: Ship via PR**

```bash
git checkout -b custom-domain
git add firebase.json
git commit -m "feat: canonical-host redirect for thirdmindlearning.com"
git push -u origin custom-domain
gh pr create --fill --base main
```
Expected: the preview deploy still builds and checks clean (the redirect config doesn't change build output). Merge:
```bash
gh pr merge custom-domain --squash --delete-branch
```
Expected: the `main` deploy's smoke test now curls `https://thirdmindlearning.com` and gets `HTTP 200` with the marker present.

---

## Task 11: Verified restore test

**Files:**
- Modify: `README.md` (fill in the "Last verified" line)

**Interfaces:**
- Consumes: the pushed repo (Task 9 at minimum; the custom-domain URL if Task 10 is also done).
- Produces: a recorded, dated proof that `git clone` + `npm ci` + `npm run build` + `npm run check` reproduces a clean site from the GitHub repo alone.

- [ ] **Step 1: Run the restore test**

```bash
cd "$(mktemp -d)"
git clone https://github.com/joeyroots/third-mind-learning.git third-mind-learning
cd third-mind-learning
npm ci
npm run build
npm run check
```
Expected: `check passed — 5 page(s), 0 problems`.

- [ ] **Step 2: Record the result in `README.md`**

In the original repo (not the temp clone), replace the "Last verified" line:
```markdown
**Last verified:** 2026-09-12 — clean clone, `npm ci && npm run build && npm run check` passed with 0 problems.
```
(Use today's actual date when this step runs.)

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: record verified restore test"
git push
```

- [ ] **Step 4: Clean up the temp clone**

```bash
rm -rf <the mktemp -d path from Step 1>
```
