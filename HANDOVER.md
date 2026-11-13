# Handover: ONLYOFFICE Apps for Zapier

Context for the next maintainer that the code doesn't show. Day-to-day rules are in `AGENTS.md` and the skills in
`.claude/skills/`; the release steps are in `.claude/skills/release/SKILL.md`.

## 1. Type of integration

- A **Zapier app** built with Zapier Platform CLI. The code runs on Zapier's servers (AWS Lambda, Node.js 22) and gets
  there with `zapier-platform upload`. It isn't a plugin inside ONLYOFFICE and isn't a service that we host.
- The public app is the one in the committed `.zapierapprc` (id `196433`). A developer may point the local
  `.zapierapprc` to a private copy of the app; never commit that change.
- It works with **ONLYOFFICE Apps** (formerly ONLYOFFICE DocSpace) only:
  - the REST API `https://<workspace>/api/2.0/...` for triggers, actions and searches;
  - DocSpace webhooks (`POST` / `DELETE /api/2.0/settings/webhook`) for instant triggers.

  It doesn't call ONLYOFFICE Docs (Document Server) directly: conversion and form reports go through the DocSpace API.
- Sign-in: workspace address, email and password (session authentication, `POST /authentication`). Only `https://`
  addresses are accepted, because the password is sent. The workspace must be reachable from Zapier's servers.
  Accounts with two-factor authentication or SSO can't connect.
- Versions:
  - Zapier Platform core and CLI 19.2.0, Node.js 22.23.3.
  - ONLYOFFICE Apps 4.0 and later. Support of earlier DocSpace versions was removed on purpose in 1.1.3; don't add
    fallbacks for them.

## 2. Main features

User scenarios (full tables of fields and API methods in `README.md`):

1. **Connect a workspace** in Zapier with its address, email and password.
2. **Start a Zap on an event in a room or in the Files section** (webhook triggers, instant): file created, updated,
   moved, deleted; folder created, updated, moved, deleted; room archived, updated; form submitted (virtual data
   rooms); form filled out (form filling rooms). Filters: room, folder, form.
3. **Start a Zap on something new found by polling:** Room Created, User Added, New Room Member.
4. **Manage rooms:** create (also from a template), get, archive, unarchive, add and remove tags, get the external
   link, get members, add or remove a user, invite a guest.
5. **Manage files and folders:** create (empty or with text or HTML content), upload from a URL, download for later
   steps, get, rename, move, copy, delete, convert, lock, unlock, get the external link, list folder contents,
   generate the report of a form.
6. **Manage people:** invite a user, change the user type, disable and enable a user.
7. **Find things:** Find File, Find Folder, Find Room, Find User. Room and user fields of actions can use Find Room
   and Find User.

## 3. Build

- Toolchain: Node.js 22.23.3 (`.node-version`, `engines`), pnpm 8.10.4 (`.pnpm-version`, `packageManager`), Zapier
  CLI 19.2.0 installed globally with `pnpm install-zapier`. The CLI version must match `zapier-platform-core`.
- There are no private packages or registries; all dependencies come from npmjs.com. The license check in CI uses the
  `ONLYOFFICE/check-licenses` GitHub action and `.check-licenses.yml`.
- `pnpm build` (`makefile.js build`) doesn't use the standard Zapier build of the source folder:
  1. esbuild bundles `index.js` and all dependencies except `zapier-platform-core` into one minified
     `dist/index.js`.
  2. It writes a small `dist/package.json` with only `zapier-platform-core` and `pnpm.overrides`. The overrides must
     stay: `zapier-platform-core` pins a vulnerable `form-data`.
  3. It copies `.zapierapprc`, runs `pnpm install --prod` in `dist/` and `zapier-platform build`, which validates the
     app (also against Zapier's style checks online) and writes `dist/build/build.zip` and `dist/build/source.zip`.
- On a local machine `zapier-platform build` can hang; run `CI=true pnpm build`.
- `pnpm smoke` loads the built `dist/index.js` and stops with an error if its definition (keys, fields, samples,
  versions) differs from the source. CI runs it after every build in `stage.yml` and `release.yml`.
- `pnpm test` is reserved by Zapier CLI (`zapier-platform test` calls it). Use `pnpm tt`: it loads `.env` and runs
  `zapier-platform test`, which validates the app and runs all tests.
- `.env` (created with `pnpm setup-env`) holds the test workspace address, email and password and the Zapier deploy
  key. CI takes the same values from GitHub variables and secrets. A test workspace for employees is available from
  the person named in `CONTRIBUTING.md`.

## 4. Publication

- The app is published in the **Zapier App Directory** as the public app `196433`.
- State of the versions on Zapier at the time of writing:
  - `1.1.0` is promoted: new users get it, and it is the release of `main` (tag `v1.1.0`).
  - `1.0.1` is still used by old Zaps.
  - `1.1.1`, `1.1.2` and `1.1.3` were uploaded for checks but never promoted. `develop` has `1.1.3` with webhooks,
    new triggers and about 30 new actions; it isn't released yet.
- How a release goes (step by step in `.claude/skills/release/SKILL.md`): merge `develop` into `main` →
  `create-tag.yml` creates the tag `v<first version in CHANGELOG.md>` → `release.yml` builds, checks the build,
  uploads, promotes and creates a GitHub release with the build archives.
- Manual steps that CI doesn't do:
  - Moving existing users to the new version: `zapier-platform migrate <old> <new> [percent]`. `promote` only makes
    the version the default for new users.
  - Deprecating old versions: `zapier-platform deprecate <version> <date>`, if needed.
  - The listing (title, description, logo, categories) and user issues: in the Zapier developer platform
    (developer.zapier.com), not in the code.
- `promote` reads the section of the version from `CHANGELOG.md`, runs Zapier's checks of the version and fails on
  errors. The app is already public, so promoting a new version doesn't need a manual review by Zapier.

## 5. Things the code doesn't say

Decisions that look strange but are on purpose:

- **Keys are forever.** Never rename the `key` of a trigger, action, search or field, and never change what a field
  value means: existing Zaps break. Labels can change. Example: "Share Room" is now "Add User to Room" with the old
  key `shareRoom`.
- **New fields keep the old behavior for old Zaps.** A Zap made before a field existed sends no value, so the empty
  value must mean the old behavior (for example, link actions of old Zaps still create the link; room invitations of
  old Zaps still send emails).
- **Files section variants** are separate keys with the `InMyDocuments` suffix ("Files" in texts, `@my` in the API).
- **Polling instead of webhooks** for Room Created and User Added (only admins can subscribe to `room.created` and
  `user.created`) and for New Room Member (DocSpace has no such event; `user.invited` is about the workspace).
- **Webhooks:**
  - Zapier gives the headers of a hook with the `Http-` prefix and changed case; the signature check
    (`x-docspace-signature-256`) handles it.
  - DocSpace sends an empty request when it checks the address of a new webhook; it is accepted and ignored.
  - The secret key has exactly 30 characters of all kinds: DocSpace checks it like a password and allows at most 30.
  - Event masks go above 32 bits: don't use bitwise operators on them.
  - Filters use the webhook payload, because it keeps the place of the entry before the event (the API answer of a
    trashed file no longer has the room).
  - Payloads of nested entries have no room id, so filters use the direct parent, like polling.
  - The API version of the entry is fetched so that webhooks and test records return the same fields; the payload is
    used only when the API answers 403 or 404.
  - DocSpace removes a webhook by itself, for example when the target answers 410; unsubscribing from a missing
    webhook isn't an error.
- **Session key:** it goes only to the workspace origin, never to file URLs. Any 401 makes Zapier sign in again, so a
  401 from a foreign file URL is turned into a normal error in `uploader.js`.
- **No silent side effects:** `GET …/link` creates a public link, so link actions read `…/links` unless the user
  allows creating one.
- **Waiting:** a Zapier step stops after about 30 seconds, so async DocSpace operations wait at most 20.
- **Sorting:** a `sortBy` in a request becomes the user's default sort order in the DocSpace interface. Don't send it
  where the order doesn't matter; sort on our side.
- **Rooms list:** form filling rooms are in a separate section and aren't in the default `GET /files/rooms`.
- **User types:** `PUT /people/type/{type}` refuses downgrades to User or Guest; they go through the async
  `POST /people/type`.
- **Halted vs failed:** `HaltedError` only when the action did nothing on purpose; real failures throw
  `z.errors.Error`. Zapier turns off Zaps whose runs mostly fail, and halted runs don't count.
- **Ids:** `normalizeId` keeps ids of third-party storage (`sbox-1-…`) as strings; Zapier deduplicates trigger
  records by `id`, so ids must stay stable.
- **Test workspace limits:** it allows 12 active rooms, so integration tests archive the rooms they create or
  unarchive. Integration tests run in order with shared state.
- **Line endings:** most files are LF, some are CRLF, and there is no `.gitattributes`. Keep each file as it is.
- **Old code:** two old `var`s stay as they are.

## 6. Known problems, tech debt, branches

Known bugs and security notes aren't kept in the repository; they are handed over in person.

Tech debt:

- Integration tests are one long sequence with shared state: one failure stops the rest. Only the owner account is
  used, so behavior for Room admins, Users and Guests isn't tested automatically.
- There is no coverage tool.
- Workflows use old action versions (`actions/checkout@v3`, `actions/setup-node@v3`, `pnpm/action-setup@v2`); pnpm 8
  is old.
- Mixed line endings without `.gitattributes`.

Branches: only `develop` and `main` are current. All other branches, local and remote, are old and can be ignored.

## 7. Plans and promises

There are no plans or promises to customers or partners.

## Manual check list

Automated checks: `pnpm check`, `pnpm lint`, unit tests, `pnpm tt` (integration tests of every main feature on the
test workspace), `pnpm smoke` (the built bundle). What they can't cover is checked by hand in the Zap editor after
`CI=true pnpm build` and `pnpm upload` (or the `stage.yml` workflow), with a test workspace:

1. **Connection:** connect the account. A wrong password and an `http://` address give clear errors; the connection
   label shows the account.
2. **Webhook trigger:** make a Zap with File Created and a room. Test records load. Turn the Zap on, create a file in
   the room, and check that the Zap runs within a minute. Turn the Zap off and check that the webhook is gone from the
   workspace (Developer Tools → Webhooks). If turning on fails with "took too long to be ready" right after an upload,
   try again.
3. **Polling trigger:** Room Created shows test records.
4. **Actions:** Create Room, Create File, Upload File from a public URL, Download File with the file used in the next
   step, Archive Room. Each step test returns the entry, not an operation status. On the free Zapier plan a Zap has
   two steps, so test actions one at a time.
5. **Search:** Find Room fills the room field of an action.
6. **Dropdowns:** room, folder and file lists load and page.
7. **After a release:** `zapier-platform versions` shows the new version as promoted; after `migrate`, an old Zap still
   runs.
8. Turn off the test Zaps and archive test rooms.
