---
name: onlyoffice-zapier
description:
  The ONLYOFFICE Apps (DocSpace) Zapier integration - repo map, the two layers (DocSpace API client and Zapier
  definitions), session authentication, webhook and polling triggers, dropdowns, actions, searches, and the data and
  error conventions, with DocSpace 4.0 and Zapier Platform references. Use at the start of every task in this repo
  together with onlyoffice-zapier-development.
---

# ONLYOFFICE Apps for Zapier

The app has webhook and polling triggers, hidden triggers for dropdowns, actions and searches, all on session
authentication. Plain JavaScript (CommonJS) with JSDoc types checked by `tsc`, Zapier Platform 19.2.0.
DocSpace was renamed ONLYOFFICE Apps in 4.0: user-facing texts say "workspace" and "ONLYOFFICE Apps", the code and
the API still say DocSpace.

## Repo map

| Path | What |
| --- | --- |
| `index.js` → `app/app.js` | The app definition: authentication, `beforeRequest` / `afterResponse`, `creates` / `searches` / `triggers` keyed by `key`, `hydrators`, `flags.cleanInputData: false` |
| `app/docspace/client/client.js` | `Client` (`url`, `request`), `Progress` (polls async operations), `Service`, `normalizeId`, `stripExtension`, `responseStatus` / `isNotFoundError`, room type checks and role lists, constants |
| `app/docspace/auth/auth.js` | `AuthenticationService`, `beforeSessionAuthRequest`, `isSameOrigin` |
| `app/docspace/files/files.js` | `FilesService`: rooms, folders, files, file operations, links, sharing, tags, templates, upload session; DTO typedefs |
| `app/docspace/people/people.js` | `PeopleService`: users, invitations, user type and status |
| `app/docspace/webhooks/` | `events.js` (event flags), `webhooks.js` (`POST` / `DELETE /settings/webhook`) |
| `app/docspace/*/*.samples.js` | Samples for triggers and actions |
| `app/zapier/auth/auth.js` | `sessionAuth`: fields, `sessionConfig.perform`, `test`, `connectionLabel` |
| `app/zapier/files/actions.js` | File, folder and room actions and their helpers (`completeOperation`, `primaryLink`, `findMember`, `moveOrCopy`, `INVITATION_FIELDS`, `ROLE_NAMES`) |
| `app/zapier/files/triggers.js` | Webhook and polling triggers, hidden dropdown triggers (`hidden: true`) |
| `app/zapier/files/searches.js` | Find File, Find Folder, Find Room |
| `app/zapier/files/uploader.js`, `hydrators.js` | Upload by URL in 10 MB chunks; lazy download of a file for later steps |
| `app/zapier/people/` | `actions.js` (Invite User, Change User Type, Disable / Enable User), `triggers.js` (User Added, disabled users list), `searches.js` (Find User) |
| `app/zapier/webhooks/hooks.js` | `createWebhookTrigger`: subscribe, unsubscribe, signature check, filters, `fetchEntry` |
| `app/zapier/pagination.js` | `PAGE_SIZE` (100), `pageFilters(bundle)` |
| `app/zapier/refusals.js` | `afterResponse` that turns 403 / 402 of the workspace into clear errors |
| `app/zapier/fields.js` | `noRightsField(text)`: an explanation instead of an empty list |
| `app/zapier/z.fixture.js`, `*/*.fixture.js` | Test fixtures: fake `z`, webhook bundles, test sign-in |
| `vendor/*.d.ts` | Types for `tsc` |
| `makefile.js` | `all`, `build`, `tt`, `upload`, `promote`, `release`, `setup-env`, `install-zapier`, `install-lefthook` |

## Two layers

- **`app/docspace/`** knows only the REST API. One `*Service` method per endpoint, with a JSDoc ` ```http ` block
  (`GET /files/file/{{fileId}}`). It builds the URL with `this.client.url(path, filters)`, puts ids into paths with
  `encodeURIComponent`, and calls `this.client.request(method, url, body)`. `Client.request` returns the unwrapped
  `response` and throws when `status` isn't 0. GET requests have no body.
- **`app/zapier/`** holds the Zapier definitions. A `perform` creates `new Client(bundle.authData.baseUrl, z.request)`
  and the services it needs, and never builds URLs or headers itself.
- Files section variants are separate keys with the `InMyDocuments` suffix and use the `…InMyDocuments` dropdowns
  (`app.test.js` checks it). The section is "Files" in texts, `@my` in the API.

## Authentication

Session authentication: fields `baseUrl` (only `https://`, normalized without stripping `www.`), `username`, `password`.
`sessionConfig.perform` calls `POST /authentication` and keeps the token as `sessionKey`. `beforeSessionAuthRequest`
adds `Authorization: <sessionKey>` only to requests to the workspace origin, never to file URLs or other hosts. The
test checks `GET /authentication` and returns `GET /people/@self`. On any 401 Zapier signs in again. Two-factor
authentication and SSO accounts can't connect.

## Triggers

- **Webhook triggers** (`createWebhookTrigger` in `hooks.js`) subscribe each Zap to DocSpace webhooks with an event
  mask, check the signature, filter by section, room, folder or entry, and fetch the API version of the entry so that
  webhooks and test records return the same fields. `performList` gives the test records of the Zap editor only.
- **Polling triggers** (plain definitions with `perform`): Room Created and User Added (their events are only for
  admins) and New Room Member (DocSpace has no such event).
- **Hidden triggers** feed dropdowns (`dynamic: "<key>.id.<label field>"`). They page with `canPaginate`.

Details and the recipe: `onlyoffice-zapier-new-trigger`.

## Actions and searches

Actions are `creates`; searches are `searches` and can back a field with `search: "<searchKey>.id"`. Details and the
recipe: `onlyoffice-zapier-new-action`. Conventions that hold for all of them:

- **Texts** (checked by `app.test.js`): label in Title Case; noun is one singular word; description "Triggers when …."
  for triggers, "<Verb>s …." for actions, "Finds …." for searches (label starts with "Find"). Field labels in sentence
  case, without "id". Help texts are full sentences.
- **Fields:** a room field is `dynamic: "roomCreated.id.title"` + `search: "searchRoom.id"`; a user field uses
  `userAdded` + `searchUser`. A field that other fields depend on has `altersDynamicFields: true`. Function fields
  return fields that depend on the account or on other values (roles, user types, formats).
- **Input values:** `cleanInputData` is off, so empty strings and `null` reach the code. Booleans can come as strings:
  compare `String(value) === "true"`. Ids go through `normalizeId`.
- **Output:** return the entry the action worked on, not the progress of an operation; ids through `normalizeId`;
  file titles without the extension (`stripExtension`), the extension is in `fileExst`.
- **Async operations** (archive, unarchive, delete, move, copy, duplicate): `Progress` + `completeOperation`, which
  waits up to 20 seconds and throws if the operation fails or is still running.
- **Never create things silently:** `GET …/link` creates a public link. The link actions read `…/links` unless the user
  turns on "Create the link if there is none".

## Ids

`normalizeId` turns numeric strings into numbers and keeps other ids as strings: user ids are GUIDs, files and folders
in third-party storage (Box, Dropbox, …) have ids like `sbox-1-…`. Never `Number(id)`; compare ids with
`String(a) === String(b)`. Zapier deduplicates trigger records by `id`, so an id must stay stable between runs.

## Errors

| Situation | Use |
| --- | --- |
| A real failure: bad input, failed or unfinished operation, unexpected response | `throw new z.errors.Error(message, code, status)`, for example `("Select a room or a folder.", "InvalidData", 400)` |
| The action deliberately did nothing (the name is taken and the user chose Skip, the guest is already a member, no link and creating it is off) | `throw new z.errors.HaltedError(message)` |
| 403 / 402 from the workspace | Nothing: `refusals.js` turns them into "The workspace refused the request …" / "The tariff …" |
| A specific message for 403 / 402 | Catch and check `responseStatus(error)`: the status stays readable after `refusals.js` |
| The account has no rights for a list | Return `noRightsField("Only … can ….")` from the function field |

Zapier turns off a Zap when most of its runs fail, and halted runs don't count as failures. So never use
`HaltedError` for real failures, and never swallow errors.

## References

| Reference | Load it when |
| --- | --- |
| [`references/docspace-api.md`](references/docspace-api.md) | Calling a DocSpace endpoint: envelope and limits, enums (room types, roles, user types, sections), rooms, links, sharing, people, upload, webhooks, rights |
| [`references/zapier-platform.md`](references/zapier-platform.md) | Using a Zapier Platform feature: middleware order, errors, dropdowns, function fields, paging, hooks, hydration, limits |
