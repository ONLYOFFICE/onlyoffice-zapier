---
name: onlyoffice-zapier-new-action
description:
  Recipe for adding or changing an action (create) or a search in the ONLYOFFICE Apps Zapier integration - checking
  the DocSpace endpoint, the service method, the definition with texts and input fields, perform, returned data and
  errors, async operations, the sample, registration, tests, README and changelog. Use when the user asks to add,
  extend or fix an action or a search ("add a Delete Room action", "a Find Group search", "a new field for Upload
  File"). For triggers use onlyoffice-zapier-new-trigger.
---

# Adding an action or a search

Read `onlyoffice-zapier` first, and `onlyoffice-zapier-development` for style, tests and checks. Find the closest
existing action and follow it: field keys, texts and data must look the same across similar actions.

## 1. Check the endpoint

- Find the method in the DocSpace API docs or sources (`references/docspace-api.md` of `onlyoffice-zapier` lists the
  ones in use). Note the body, the response, who can call it and whether it starts an async operation.
- Check whether DocSpace silently ignores the request in some cases (sharing does) and whether a read creates
  something (`GET …/link` does). The action must not hide either.
- Requests to the test workspace only after the user confirms.

## 2. Service method

In `app/docspace/<area>/<area>.js`, one method per endpoint:

```js
  /**
   * ```http
   * PUT /files/file/{{fileId}}
   * ```
   * @param {number|string} fileId
   * @param {string} title
   * @returns {Promise<FileData>}
   */
  renameFile(fileId, title) {
    const url = this.client.url(`/files/file/${encodeURIComponent(fileId)}`)
    return this.client.request("PUT", url, { title })
  }
```

Add typedefs for new response shapes next to the others in the same file.

## 3. Definition

In `app/zapier/<area>/actions.js` (or `searches.js`), after a `<Name>Fields` typedef of the input data:

```js
const renameFile = {
  display: {
    description: "Renames a file.",
    label: "Rename File"
  },
  key: "renameFile",
  noun: "File",
  operation: {
    inputFields: [ /* see below */ ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RenameFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const file = await files.renameFile(normalizeId(bundle.inputData.fileId), bundle.inputData.title)
      file.id = normalizeId(file.id)
      file.title = stripExtension(file.title)
      return file
    },
    sample: samples.file
  }
}
```

**Texts** (`app.test.js` checks the form):

- Action label: `<Verb> <Noun>` in Title Case ("Get Room External Link", "Add User to Room"); search label
  "Find <Noun>". The key is camelCase and never changes after release.
- Description: one sentence, "<Verb>s …." for actions, "Finds …." for searches. Say what isn't obvious: a permanent
  deletion, a link that can be created, what is returned.
- Help texts: full sentences that say what the field is, what empty means and where to get the value.

**Fields.** Reuse the existing field sets:

| Field | Definition |
| --- | --- |
| Room | `altersDynamicFields: true`, `dynamic: "roomCreated.id.title"`, `search: "searchRoom.id"`, `type: "string"`, key `id` (file and folder actions) or `roomId` (members, sharing). Help text: "The room with the file. Use it to choose the file from the list." |
| Folder | `altersDynamicFields: true`, `dynamic: "foldersList.id.title"`, key `folderId`. Help text: "A folder to choose the file from. Leave empty to list the files at the top level of the room." |
| File | `dynamic: "filesList.id.title"`, `search: "searchFile.id"`, `required: true`, key `fileId`. Help text: "To use a file from the Files section, enter its ID or find it with Find File." |
| User | `dynamic: "userAdded.id.displayName"`, `search: "searchUser.id"`, key `userId` |
| Boolean | `type: "boolean"`, `default: "false"`; read with `String(bundle.inputData.x) === "true"` |
| Tags | `dynamic: "tagsList.id.name"`, `list: true`. Help text: "Choose existing tags or enter new ones." |
| Depends on the account or other fields (roles, user types, formats) | A function field `async function (z, bundle) { … return [field] }`; without rights `return noRightsField("Only … can ….")` |

Room, folder and file fields only choose an entry; the action uses the most specific one (`fileId`, else
`folderId`, else `id`). For the Files section, add a separate action with the `InMyDocuments` suffix that uses
`foldersInMyDocumentsList` / `filesListFromMyDocuments`; an empty folder means the section root
(`files.myDocumentsSection()`).

## 4. Perform

- Read ids with `normalizeId`, never `Number()`. Check required combinations yourself:
  `throw new z.errors.Error("Select a room or a folder.", "InvalidData", 400)`.
- Async operations (archive, delete, move, copy, duplicate):

  ```js
  const id = normalizeId(bundle.inputData.id)
  const operation = await files.archiveRoom(id)
  const progress = new Progress(files.listOperations.bind(files), operation)
  await completeOperation(z, progress)
  ```

  Some endpoints return an array of operations; pass the first one. Then fetch and return the entry if it still
  exists (a delete returns the finished operation). A task with its own status endpoint (the form report) gets an
  endpoint function that maps its state to an operation (`reportOperation` in `actions.js`), so that it waits and
  fails the same way.
- Return the entry the action worked on, shaped like similar actions: `id` through `normalizeId`, file titles
  through `stripExtension`. Return small objects with clear fields when there is no entry
  (`{ roomId, status: "Removed", userId }`).
- Independent requests go together in `Promise.all`.
- Errors: `z.errors.Error(message, code, status)` for failures, `HaltedError` only when the action deliberately did
  nothing. 403 / 402 are handled by `refusals.js`; catch them only for a more specific message.
- Searches return an array (empty = not found), newest or best match first. `filterValue` matches substrings, so
  filter exact matches on our side when the meaning needs it; don't send `sortBy`, sort the results here.

## 5. Sample

Use an existing sample from `app/docspace/<area>/<area>.samples.js` when the action returns the same entry. A new
sample comes from a real response: keep the fields the action returns, example values (`https://example.onlyoffice.com`,
`John Doe`), ids as numbers, titles without extensions.

## 6. Register

- Export it from the module (`module.exports`, sorted).
- Import it in `app/app.js` and add `[x.key]: x` to `creates` or `searches` (sorted).
- Add the required registration test to `app/app.test.js`: ``has the `<key>` creation`` (or ``search``), in its
  section, sorted by key, with the import of the definition.

## 7. Tests

- Unit tests in the area's unit test file (`app/zapier/files/files.unit.test.js`, …) with `fakeZ`: the request
  (`z.calls[i].method`, `path`, `body`, `query`), the returned data, every error, ids like `sbox-…`, empty and string
  values. Function fields: test the lists with and without rights.
- An integration test in the area's integration file (`app/zapier/files/files.test.js`, …): create the data it needs,
  run the action with `tester`, check the result, restore the workspace state where possible.

## 8. Docs and checks

- README: a row in the actions (or searches) table: label, API method with a link, field labels as in Zapier.
- CHANGELOG: `- new <Label> action` (or `search`) in the top section.
- Run the checks from `onlyoffice-zapier-development`; integration tests and a live test of the step in the Zap
  editor after the user confirms.
