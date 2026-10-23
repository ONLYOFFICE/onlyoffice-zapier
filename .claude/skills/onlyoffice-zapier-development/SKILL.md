---
name: onlyoffice-zapier-development
description:
  Development rules for the ONLYOFFICE Apps Zapier integration - environment, code style and lint rules, line endings,
  JSDoc types, unit and integration tests, the check commands, live checks in Zapier, git and changelog rules, CI and
  release, keeping AGENTS.md and the skills current, and the review checklist with the report format. Use for any
  code change in app/, for verifying a change, for commits and for reviews.
---

# Development of the Zapier integration

## Environment

- Node.js 22.23.3 (`.node-version`), pnpm 8.10.4 (`.pnpm-version`), Zapier CLI 19.2.0 (`.zapier-version`,
  `pnpm install-zapier`), git hooks with `pnpm install-lefthook` (eslint on staged files, commitlint).
- `.env` (from `pnpm setup-env`): `DOC_SPACE_BASE_URL`, `DOC_SPACE_USERNAME`, `DOC_SPACE_PASSWORD`,
  `ZAPIER_DEPLOY_KEY`. Load it with `set -a; . ./.env; set +a`. Never print it, paste it or ask for its values.
- `.zapierapprc` holds the Zapier app id; a developer may point it to a private copy of the app. Don't commit its
  local changes; stash it before history rewrites.

## Code style

ESLint (`eslint.config.js`) and `tsc` (`tsconfig.json`: `strict`, `checkJs`) enforce most of it. Keep lint at zero
warnings.

- Every file starts with the copyright header and `// @ts-check`:
  ```js
  //
  // (c) Copyright Ascensio System SIA 2026
  //

  // @ts-check
  ```
- CommonJS, 2 spaces, double quotes, no semicolons, no trailing commas, lines up to 120 characters (comments and URLs
  aren't counted; split long strings with `+`).
- Requires: built-in, external, then local modules; names inside `{ … }` sorted. `module.exports = { … }` at the end,
  keys sorted.
- **`sort-keys`:** object keys in alphabetical order, Zapier definitions included (`display`, `key`, `noun`,
  `operation`; `inputFields`, `perform`, `sample`; field keys `altersDynamicFields`, `default`, `dynamic`, `helpText`,
  `key`, `label`, `required`, `search`, `type`).
- **`array-element-newline: always`:** an array of two or more elements has one element per line, array
  destructuring too:
  ```js
  const [
    file,
    settings
  ] = await Promise.all([
    files.fileInfo(id),
    files.settings()
  ])
  ```
- `function-paren-newline: multiline`: put all arguments on one line or each on its own; when a single long argument
  doesn't fit, move it to a variable. Ternaries stay on one line. `i = i + 1` instead of `++`. `const` by default,
  `===`, braces for every block.
- Types are JSDoc only. Every function has `@param` and `@returns`; typedefs (`@typedef {Object} <Name>Fields` for
  input data) go at the top of the file; casts are `/** @type {X} */ (value)`. Ids are `number|string`.
- Service methods have a ` ```http ` block with the method and path (`{{id}}` placeholders).
- Names: keys and functions in camelCase; Files section variants end with `InMyDocuments`; hidden dropdown triggers
  usually end with `List`; constants in UPPER_CASE.
- Comments only for what the code can't say: why a choice was made, a DocSpace or Zapier behavior it works around.
  Full sentences in simple English; no comments that repeat the code. Two old `var`s stay as they are.

### Line endings

Most files use LF; some files in `app/zapier/` and `eslint.config.js` use CRLF, and there is no `.gitattributes`.
Keep each file's endings: check with `git ls-files --eol <file>`, edit with tools that keep them, never `sed -i` a
CRLF file. New files use LF. After an edit, `git diff --stat` must show only the changed lines, not the whole file.

## Tests

All test files end with `.test.js` and run with `uvu`; name a new test file `<name>.test.js`. Add tests to the
existing file of the area when there is one. There are two kinds, told apart by their content:

- **Unit tests** need no workspace. They use the fake `z` from `app/zapier/z.fixture.js`:
  - `fakeZ(routes)` answers requests by `"METHOD /path"` (relative to `/api/2.0`) with an object or a
    `(call) => response` function, records them in `z.calls` (`method`, `path`, `query`, `body`), and fails unknown
    routes with 404;
  - `authData`, `webhookBundle(trigger, payload, inputData)`, the error classes `ZapierError`, `HaltedError`,
    `RefreshAuthError`;
  - in the area test files, `run(fn, z, bundle)` adds `authData` and `caught(fn)` returns the thrown error.

  `app/app.test.js` checks registration and the text style of every trigger, action and search.
- **Integration tests** use `createAppTester(App)` and a real workspace from `.env`: one `suite` per area with a shared
  `context`, signed in by `sessionAuthPerform`, running in order. They create their own rooms and files.

Run them:

```bash
for f in $(grep -rL --include='*.test.js' createAppTester app); do node "$f" || exit 1; done   # unit tests
set -a; . ./.env; set +a; pnpm tt                                                            # everything, live
```

What a change needs:

- Unit tests next to the related tests of the area (`app/zapier/files/…`, `app/zapier/people/…`): the request
  (method, path, query, body), the returned data (normalized ids, titles without the extension), each error branch,
  and edge cases: third-party ids (`sbox-…`), empty values, booleans as strings.
- **Required:** every registered trigger, action and search has a registration test in `app/app.test.js`
  (``has the `<key>` trigger``, ``has the `<key>` search``, ``has the `<key>` creation``) in its section, sorted by
  key. A new key without one is a review blocker.
- An integration test for the main path when the change talks to DocSpace. Leave the workspace as it was where you
  can (for example, archive a room that the test unarchived): the test workspace has a limit of active rooms.

There is no coverage tool. Check by hand that every new branch of the code has a test.

## Checks

Before a commit:

```bash
pnpm check
pnpm exec eslint --max-warnings 0 .
zapier-platform validate --without-style
for f in $(grep -rL --include='*.test.js' createAppTester app); do node "$f" || exit 1; done
```

After the user confirms: `pnpm tt` (integration tests on the test workspace), then `CI=true pnpm build` and
`pnpm upload` to try the change in the Zap editor. The user signs in to Zapier and DocSpace themselves; never enter
credentials. A live check covers the step test in the editor and, for triggers, a turned-on Zap that gets a real
event; turn the test Zaps off afterwards.

## Git, changelog, release

- Branches from `develop`: `feature/…`, `fix/…`, `chore/…`; pull requests go to `develop`; `main` changes only with a
  release.
- Conventional Commits in lowercase (`feat: …`, `fix: …`, `perf: …`, `chore: …`, `test: …`), checked by commitlint.
  One change per commit; fixes with the same meaning can share one. No AI co-author trailers. Commit only when the
  user asks; push only when the user asks.
- `CHANGELOG.md`: the top `## <version>` section gets one line per user-visible change, starting in lowercase:
  `- new Rename File action`, `- fix Remove User from Room in rooms with more than 100 members`,
  `- Create Room can add tags`.
- `README.md`: the tables of triggers (Trigger | Fields), actions (Actions | API method | Fields) and searches. Field
  names exactly as the labels in Zapier; API methods with links to api.onlyoffice.com.
- Release: a push to `main` creates a tag from the changelog version (`create-tag.yml`); the tag runs `release.yml`
  (build, upload, promote, GitHub release). Don't change `version` in `package.json` unless the user asks.
- CI (`audit.yml`, pull requests to `develop` and `main`): `pnpm check`, `pnpm lint`, `pnpm tt` against the test
  workspace. `licenses.yml` checks dependency licenses (`.check-licenses.yml`).

## Keeping agent docs current

`AGENTS.md` and the skills in `.claude/skills/` are part of the code. When a change makes them wrong or incomplete,
update them in the same branch, in the commit of the change or in a separate `chore:` commit:

| What changed | Update |
| --- | --- |
| New files, modules, shared helpers, kinds of triggers; the architecture or the auth | `onlyoffice-zapier/SKILL.md` (repo map and sections) |
| Facts about the DocSpace API: endpoints, enums, rights, events, limits | `onlyoffice-zapier/references/docspace-api.md` |
| Behavior of Zapier Platform, a new platform version | `onlyoffice-zapier/references/zapier-platform.md` |
| Commands, tests, fixtures, checks, CI, release, git rules, style | `onlyoffice-zapier-development/SKILL.md` and `AGENTS.md` |
| Typical fields, steps or patterns of actions and searches | `onlyoffice-zapier-new-action/SKILL.md` |
| Typical fields, steps or patterns of triggers and dropdowns | `onlyoffice-zapier-new-trigger/SKILL.md` |
| A new skill | Its row in the skills table of `AGENTS.md` |

Write facts that stay true; leave out counts and lists that change with every new action.

## Review checklist

1. **Correctness:** endpoint, method and body match the DocSpace API; async operations go through
   `completeOperation`; ids through `normalizeId`; the action does what its label and description say.
2. **Compatibility:** no renamed or removed keys of triggers, actions, searches or fields; field values keep their
   meaning; output fields aren't removed or renamed.
3. **Texts:** Zapier style (`app.test.js`), simple English; help texts say what happens and what empty means;
   destructive actions say that they can't be undone.
4. **Rights:** who can run it; lists without rights show `noRightsField`; 403 / 402 give clear messages.
5. **Data:** returns the entry, not progress; consistent with similar actions (ids, titles, fields).
6. **Errors:** `z.errors.Error` for failures, `HaltedError` only when nothing was done on purpose; nothing swallowed.
7. **Safety:** no public link created silently; the session key goes only to the workspace; user URLs downloaded
   with `redirect: "error"`; no secrets in errors or logs.
8. **Lists:** `count` ≤ 100, dropdowns page with `canPaginate`; no `sortBy` where the order doesn't matter.
9. **Tests and docs:** a registration test for every new key, unit tests for every branch, an integration test for
   the main path; CHANGELOG and README updated; checks pass; line endings of the files kept.
10. **Agent docs:** `AGENTS.md` and the skills match the change (see "Keeping agent docs current").

Report format:

```markdown
## Findings
- Blocker: `path:line` - issue, why it matters, minimal fix.
- Should fix: `path:line` - risk, suggested fix.
- Nit: `path:line` - style.
## Checks run
- type check, lint, validate, unit tests, integration tests, live checks.
## Not verified
- for example, no account with lower rights, no self-hosted workspace.
## Summary
- One or two sentences.
```
