# Zapier Platform 19 — behavior the integration relies on

Checked in `node_modules/zapier-platform-core/src` and `zapier-platform-schema` 19.x. When in doubt, read the source
there instead of guessing.

## Requests

- Before a request: input injection, `prepareRequest`, the app's `beforeRequest` (our session header), header
  sanitizing, query params.
- After a response, in this order: `prepareResponse`, redirect host check, logging, **`throwForStaleAuth`**,
  `throwForThrottling` (429), the app's **`afterResponse`** (`refusals.js`), **`throwForStatus`**.
- `throwForStaleAuth` runs for session authentication: **any** 401, from any host, throws `RefreshAuthError` before our
  `afterResponse`, and `skipThrowForStatus` doesn't stop it. Zapier then signs in again. A 401 from a foreign URL (a
  file to upload) must be caught and turned into a normal error (see `uploader.js`).
- `throwForStatus` throws for status ≥ 400 unless the request or response has `skipThrowForStatus`.
- `z.request({ raw: true })` returns a stream response; `redirect: "error"` refuses redirects (keep it for user URLs).

## Errors

| Error | Effect |
| --- | --- |
| `z.errors.Error(message, code, status)` (`AppError`) | The run fails with the message. `error.message` is JSON `{ message, code, status }`, so `responseStatus()` still reads the status |
| Error from `throwForStatus` | The run fails; the message is JSON with `status` and the response |
| `z.errors.HaltedError(message)` | The run stops as "halted"; it isn't counted as a failure |
| `z.errors.RefreshAuthError` | Zapier runs `sessionConfig.perform` again and repeats the step |
| Plain `Error` | The run fails with the message (fine in `sessionConfig.perform` and the auth test) |

Zapier turns a Zap off when almost all of its runs in recent days fail; halted runs don't count. A step has about 30
seconds; our operations wait at most 20.

## Input

- `flags.cleanInputData: false` (in `app.js`): empty strings, `null` and empty arrays stay in `bundle.inputData`.
- Values can come as strings even for `integer` and `boolean` fields (mapped from earlier steps, or from the test
  tools); booleans can be `"true"` / `"false"`. Parse and validate them.
- Fields: `required`, `default` (a string), `helpText`, `type` (`string`, `integer`, `boolean`, `text`, `file`,
  `copy`, …), `choices`, `list`, `dynamic`, `search`, `altersDynamicFields`.
- **Dropdown:** `dynamic: "<triggerKey>.<idField>.<labelField>"` uses a (usually hidden) trigger. The trigger gets
  the other field values in `bundle.inputData`.
- **Search link:** `search: "<searchKey>.<idField>"` lets the user add a search step that fills the field.
- **Function field:** a function `(z, bundle) => Field[]` in `inputFields`; Zapier calls it when the step loads and
  again when a field with `altersDynamicFields: true` changes. Use it for lists that depend on the account or on other
  values. `type: "copy"` shows a note without input.

## Triggers

- **Polling** (`perform`): Zapier calls it every few minutes and starts the Zap for each record with an `id` it hasn't
  seen. Return the newest records first; Zapier reads only the first page (`bundle.meta.page` is 0).
- **Paging:** with `operation.canPaginate: true`, dropdowns ask for the next pages with `bundle.meta.page` = 1, 2, …;
  `pageFilters(bundle)` turns it into `count` / `startIndex`.
- **Hook** (`type: "hook"`): `performSubscribe` gets `bundle.targetUrl` and its result is saved as
  `bundle.subscribeData`; `performUnsubscribe` gets it back. `perform` gets `bundle.cleanedRequest` (parsed body) and
  `bundle.rawRequest` (`content` is the raw body; header names get the `Http-` prefix and change case).
  `performList` returns test records for the Zap editor only.
- Every trigger record needs a stable `id`.

## Actions and searches

- An action (`creates`) returns one object; a search returns an array, the first item is used, and an empty array
  means "not found".
- `sample` is required and shapes the field list in the Zap editor before a test run.

## Files

- `z.dehydrateFile(hydrator, inputData)` returns a placeholder; Zapier calls the hydrator from `app.hydrators` only
  when a later step uses the file. The hydrator returns `z.stashFile(promise)`.
- `z.stashFile(z.request({ raw: true, … }))` stores a file in Zapier and returns its URL.
- A `file` input comes as a URL: Zapier-hosted (`*.zapier.com`) or any user URL.

## Tests and tools

- `createAppTester(App)` → `tester(fn, bundle)` runs a `perform` the way Zapier does (with middleware).
- `zapier-platform validate` checks the definition; `zapier-platform test` runs `npm test` with the environment.
- `zapier-platform upload` replaces a version with the same number; `pnpm upload` refuses when that version is already
  promoted (unless `--force`). `zapier-platform promote` makes a version public.
