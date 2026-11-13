# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

The ONLYOFFICE Apps (formerly ONLYOFFICE DocSpace) integration for Zapier: triggers, actions and searches that call
the DocSpace REST API. Plain JavaScript (CommonJS) type-checked by `tsc` through JSDoc, Zapier Platform 19.2.0,
Node.js 22. The background (why things are done this way, publication, the manual check list) is in
[`HANDOVER.md`](HANDOVER.md).

Read the skill that fits the task before you start (`.claude/skills/<name>/SKILL.md`):

| Skill | Read it when |
| --- | --- |
| [`onlyoffice-zapier`](.claude/skills/onlyoffice-zapier/SKILL.md) | At the start of every task: repo map, architecture, conventions, DocSpace and Zapier references |
| [`onlyoffice-zapier-development`](.claude/skills/onlyoffice-zapier-development/SKILL.md) | Any code change, checks, tests, commits, reviews |
| [`onlyoffice-zapier-new-action`](.claude/skills/onlyoffice-zapier-new-action/SKILL.md) | Adding or changing an action or a search |
| [`onlyoffice-zapier-new-trigger`](.claude/skills/onlyoffice-zapier-new-trigger/SKILL.md) | Adding or changing a trigger: webhook, polling, or a hidden trigger for a dropdown |
| [`release`](.claude/skills/release/SKILL.md) | Staging, releasing, promoting a version, migrating users, rollback |

## Structure

| Path | What |
| --- | --- |
| `index.js` → `app/app.js` | The app definition: auth, middleware, triggers, actions (`creates`), searches |
| `app/docspace/` | DocSpace REST API client: one service method per endpoint, no Zapier code |
| `app/zapier/` | Zapier definitions by area (`auth`, `files`, `people`, `webhooks`) and shared helpers |
| `*.test.js` | Unit tests (fake `z`) and integration tests (`createAppTester`, real workspace) next to the code |
| `makefile.js` | Build, smoke check, upload, promote, release commands behind the `pnpm` scripts |
| `.github/workflows/` | `audit` (checks and tests), `stage`, `create-tag`, `release`, `licenses` |

## Commands

```bash
pnpm install                 # dependencies
pnpm check                   # tsc
pnpm lint                    # eslint; keep it at zero warnings
zapier-platform validate     # the app definition
pnpm test                    # all tests; the integration tests need .env
pnpm tt                      # zapier validate + all tests with .env loaded
CI=true pnpm build           # dist/ and dist/build/*.zip; without CI=true it can hang locally
pnpm smoke                   # the built dist/index.js loads and matches the source definition
pnpm upload                  # uploads the version from package.json to Zapier
```

Tests that need no workspace:

```bash
for f in $(grep -rL --include='*.test.js' createAppTester app); do node "$f" || exit 1; done
```

## Rules

- Never rename the `key` of a trigger, action, search or input field, and never change what a field value means:
  existing Zaps break.
- Keep the line endings of each file. Most files use LF, some use CRLF (`git ls-files --eol`); don't rewrite a CRLF
  file with a tool that changes endings, for example `sed -i`. New files use LF.
- Don't print, paste or commit `.env`: it has the test workspace password and the Zapier deploy key. Don't commit
  local changes of `.zapierapprc`.
- Every change that users can see gets a line in `CHANGELOG.md` (the section of the current version) and an update of
  the tables in `README.md`.
- Comments explain only decisions that aren't obvious from the code. All texts, comments and changelog lines are in
  simple English.
- Commits follow Conventional Commits in lowercase (`feat: …`, `fix: …`, `chore: …`), one change per commit, without
  AI co-author trailers.
- Work in a branch from `develop` (`feature/…`, `fix/…`, `chore/…`); only `develop` and `main` are current. Push,
  open pull requests, upload, promote or migrate the Zapier app only when the user asks.
- Integration tests, uploads and live Zaps send requests to a real workspace and to Zapier. Run them only after the
  user confirms; run destructive steps only on test data.
- Don't commit local reports and scratch files.
- Keep this file and the skills current. When a change makes them wrong or incomplete (a new module or shared helper,
  a new convention, another command or check, a DocSpace or Zapier behavior found during the work), update them in
  the same branch as the change. The development skill lists which file covers what.
