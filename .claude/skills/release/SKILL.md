---
name: release
description:
  Step-by-step release of the ONLYOFFICE Apps Zapier integration and its publication in the Zapier App Directory -
  version and changelog, checks, staging a private version, the merge to main, the tag and release workflows, upload,
  promote, migrating users, the GitHub release, manual steps in the Zapier developer platform, and rollback. Use when
  the user asks to release, publish, stage, upload, promote, migrate users or roll back a version.
---

# Release and publication

The app is published only through Zapier: the public app is the one in the committed `.zapierapprc`. Every step that
uploads, promotes, migrates, deletes, pushes or merges needs a clear go-ahead from the user for that step. The user
signs in to Zapier (`zapier-platform login`, or `ZAPIER_DEPLOY_KEY` in the environment) and to GitHub themselves;
never enter credentials.

## How it works

| Piece | What it does |
| --- | --- |
| `pnpm build` | esbuild bundle in `dist/`, `zapier-platform build` → `dist/build/build.zip`, `source.zip`. Locally run it as `CI=true pnpm build`, otherwise it can hang |
| `pnpm smoke` | Loads `dist/index.js` and fails if its definition differs from the source |
| `pnpm upload` | `zapier-platform upload` from `dist/`. Without `--force` it first reads `zapier-platform versions` and stops if the version exists with a state other than `private` |
| `pnpm promote` | `zapier-platform promote <version> --yes`: runs Zapier's checks, takes the notes from the `CHANGELOG.md` section of the version, makes the version the default for new users |
| `pnpm release` | `gh release create <version>` (the name and tag without `v`) with the notes of `## <version> (YYYY-MM-DD)` from `CHANGELOG.md`, then uploads `build.zip`, `source.zip`. A tag that doesn't exist yet is created by GitHub on the default branch |
| `audit.yml` | Pull requests to `develop` / `main` and pushes to `main`: `pnpm check`, `pnpm lint`, `pnpm tt` on the test workspace |
| `stage.yml` | Manual: build, smoke, upload (a private version for checks) |
| `create-tag.yml` | A push to `main` (except changes only in `.github/`, `AUTHORS.md`, `README.md`): tag `v<first version in CHANGELOG.md>` |
| `release.yml` | A `v*` tag: build, smoke, upload, promote, GitHub release |

`zapier-platform versions` states: `draft` (uploaded, not public), `promoted` (the default for new users),
`available` (older versions that still have users).

## 1. Prepare the version on `develop`

Work in a branch from `develop` (`chore/release-<version>`) with a pull request to `develop`.

1. Version: `version` in `package.json` (change it only when the user asks) and the top section of `CHANGELOG.md`
   are the same. Give the section a date when the release date is known: `## 1.2.0 (2026-12-01)`. Without the date
   the GitHub release has empty notes.
2. `CHANGELOG.md` lists every user-visible change of the version; `README.md` tables match the triggers, actions and
   searches.
3. Checks:
   ```bash
   pnpm check
   pnpm exec eslint --max-warnings 0 .
   zapier-platform validate
   for f in $(grep -rL --include='*.test.js' createAppTester app); do node "$f" || exit 1; done
   set -a; . ./.env; set +a; pnpm tt        # live, after the user confirms
   CI=true pnpm build && pnpm smoke
   ```
4. `zapier-platform versions` for the public app (`git diff .zapierapprc` must be empty, or run it from a clean
   checkout). The new version must not be `promoted`. If it already exists as a `draft` (for example, after staging),
   `pnpm upload` in `release.yml` stops at the version check. Then either release under a version number that was
   never uploaded, or plan the manual upload from step 4 below.

## 2. Stage and check by hand (recommended)

1. Upload a private version: `gh workflow run stage.yml --ref develop`, or locally `CI=true pnpm build`,
   `pnpm smoke`, `pnpm upload`. A local upload goes to the app in the local `.zapierapprc`; make sure it is the one
   you mean.
2. Go through the manual check list in `HANDOVER.md` in the Zap editor. The uploaded version is visible only to the
   team of the app.

## 3. Release

1. Pull request `develop` → `main`; after the review, merge it. Push to `main` only for a release: every push that
   changes code creates a tag, and a second push with the same version fails because the tag exists.
2. `create-tag.yml` creates `v<version>`; `release.yml` runs on the tag. Watch both runs:
   ```bash
   gh run list --workflow create-tag.yml --limit 3
   gh run list --workflow release.yml --limit 3
   gh run watch <run-id>
   ```
3. `audit.yml` also runs on the push to `main` (live tests on the test workspace).

## 4. If `release.yml` fails

Fix the cause, then finish the remaining steps by hand from a clean checkout of the tag, in order, each after the
user's go-ahead:

```bash
git switch --detach v<version>
pnpm install --frozen-lockfile
CI=true pnpm build
pnpm smoke
pnpm upload            # add --force only when the version exists as a draft and must be replaced
pnpm promote
pnpm release           # only if the GitHub release wasn't created
```

Don't re-run a step that already passed (`gh release create` fails when the release exists).

## 5. After the promotion (manual)

1. `zapier-platform versions`: the new version is `promoted`.
2. Move existing users. `promote` doesn't do it:
   ```bash
   zapier-platform migrate <old> <new> 10     # a part of the users first
   zapier-platform jobs                        # wait until the migration is done
   zapier-platform migrate <old> <new>         # the rest
   ```
   Repeat for every old version that still has users (`available`). Users get no email about a migration. Zapier
   allows `migrate` only between non-breaking versions; it is safe here only because keys of triggers, actions,
   searches and fields never change and field values keep their meaning. Before the full migration, check the logs
   of the new version (`zapier-platform logs`); to go back, swap the versions in `migrate`.
3. Optionally deprecate old versions: `zapier-platform deprecate <version> <YYYY-MM-DD>`.
4. In the Zapier developer platform (developer.zapier.com): update the listing texts if needed and close the user
   issues fixed in the version.
5. Merge `main` back into `develop` so that commits made only on `main` (for example, GitHub issue templates) are in
   `develop`.
6. Check one live Zap on the new version (step 7 of the manual check list in `HANDOVER.md`).

## Rollback

```bash
zapier-platform promote <previous>
zapier-platform migrate <bad> <previous>
```

Then fix the problem in `develop` and release a new version number; never re-upload a promoted version.
