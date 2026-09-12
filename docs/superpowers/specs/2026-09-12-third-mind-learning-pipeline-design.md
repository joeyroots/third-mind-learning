# Third Mind Learning — Site Pipeline Design

**Date:** 2026-09-12
**Status:** Approved for implementation

## Purpose

Stand up the technical publishing pipeline for thirdmindlearning.com — a
course/education business site — by cloning the proven pattern already
running in production for joeyroots.com (the `personal-site` repo). This
covers infrastructure only: repo, build, hosting, CI/CD, and DNS. Real page
copy and business messaging (curriculum, offer, positioning) are explicitly
out of scope and will be handled as a separate follow-up project once this
pipeline is live.

## Scope

**In scope:**
- New GitHub repo with an Eleventy static site scaffold
- New Firebase Hosting project with a custom domain
- GitHub Actions CI/CD (lint/check, PR preview channels, production deploy)
- A minimal placeholder page skeleton, clearly marked as non-final copy
- DNS cutover guidance for thirdmindlearning.com

**Out of scope:**
- Actual site copy/messaging (home, about, program/curriculum, contact)
- Any dynamic features (accounts, payments, gated course content) — this is
  a static site, matching joeyroots.com's scope
- Multi-site Firebase hosting configurations — this gets its own dedicated
  Firebase project, not a second site bolted onto `joe-personal-site-16447`

## Architecture

Direct clone of the `personal-site` stack:

- **Static site generator:** Eleventy, building `src/*.njk` → `_site/`
  (gitignored, regenerated on every build — never edited directly)
- **Hosting:** Firebase Hosting, its own dedicated Firebase project
  (separate from `joe-personal-site-16447`)
- **CI/CD:** GitHub Actions, mirroring `personal-site/.github/workflows/deploy.yml`:
  - Feature branch → PR against `main`
  - CI runs `npm run check`; must pass before deploy
  - CI deploys a Firebase preview channel, comments the preview URL on the PR
    (`…--pr-<n>-<hash>.web.app`, standard 7-day expiry)
  - Merge to `main` → production deploy + smoke test
  - No manual `firebase deploy`; no direct content pushes to `main`
- **Rules live in the repo:** a `CLAUDE.md` in the new repo, following the
  same conventions as `personal-site/CLAUDE.md` (edit `src/*.njk` only,
  `npm run check` must print `0 problems` before every push)

## Accounts & ownership

- **GitHub:** repo created under the existing `joeyroots` account (same
  account as `personal-site` and the backup repos), public visibility.
- **Firebase/GCP:** new project created under `npjruotolo@gmail.com` (the
  account already authenticated in the local Firebase CLI and already
  owning `joe-personal-site-16447`). No account-per-site limit exists on
  Firebase's Spark (free) plan — it's scoped per project, not per account,
  so this doesn't compete with or draw from `joe-personal-site-16447`'s
  quota.
- `joe@thirdmindlearning.com` is added as an IAM collaborator on the new
  Firebase project immediately, so the business identity has access from
  day one without blocking today's setup on a separate OAuth login. Full
  ownership transfer to that account can happen later if/when the business
  needs full separation (e.g., a co-founder, a sale, dedicated billing).

## DNS

Domain `thirdmindlearning.com` is already owned by Joe. Once the Firebase
Hosting site exists, it's added as a custom domain in the Firebase console,
which produces the DNS records (A/TXT or CNAME, depending on Firebase's
current verification method) that Joe adds at his registrar. Firebase
Hosting provisions and auto-renews the SSL certificate once DNS verifies.
Registrar-side DNS changes are Joe's to make — outside the scope of what
the pipeline setup can do programmatically.

## Placeholder content

A minimal page skeleton ships with the pipeline so the deploy loop is
provably working end-to-end:

- Home
- About
- Program/Curriculum
- Contact

Placeholder copy is clearly marked as such (e.g. an HTML comment or a
visible "placeholder" banner during initial setup) so it's never mistaken
for real messaging. Real copy is a separate project.

## Testing / verification

Same verification loop as `personal-site`:
1. `npm run check` passes locally and in CI (`0 problems`)
2. A PR triggers a Firebase preview channel deploy; the preview URL loads
   and renders the placeholder pages correctly
3. Merging to `main` triggers a production deploy + smoke test
4. The production Firebase Hosting URL (`*.web.app`) serves the site
   correctly before DNS cutover
5. After DNS cutover, `thirdmindlearning.com` serves the same content over
   HTTPS

## Follow-up project (not covered here)

Once this pipeline is live, a separate project handles Third Mind
Learning's actual messaging: curriculum/offer definition, audience,
positioning, and page copy — closer in nature to the AWAI/FasterOutcomes
copywriting work than to this infrastructure task. That project replaces
the placeholder pages with real content through the same PR → preview →
merge flow this pipeline establishes.
