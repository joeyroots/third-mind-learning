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
