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
