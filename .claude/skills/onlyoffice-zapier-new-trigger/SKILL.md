---
name: onlyoffice-zapier-new-trigger
description:
  Recipe for adding or changing a trigger in the ONLYOFFICE Apps Zapier integration - choosing between a webhook
  trigger, a polling trigger and a hidden dropdown trigger, event flags, createWebhookTrigger options and filters,
  test records, rights, registration, tests, README and changelog. Use when the user asks to add, extend or fix a
  trigger or a dropdown list ("add a File Restored trigger", "a Room Deleted trigger", "the folder list misses
  folders"). For actions and searches use onlyoffice-zapier-new-action.
---

# Adding a trigger

Read `onlyoffice-zapier` first, and `onlyoffice-zapier-development` for style, tests and checks. Event flags, payloads
and who may subscribe are in `references/docspace-api.md` of `onlyoffice-zapier`.

## 1. Choose the kind

| Kind | When |
| --- | --- |
| Webhook trigger (`createWebhookTrigger`) | DocSpace has an event for it and the users of the trigger may subscribe to it |
| Polling trigger (plain definition with `perform`) | No event (New Room Member), or the event is only for admins while every user needs the trigger (Room Created, User Added). Add a comment that says why it polls |
| Hidden trigger | A list for a dropdown of another trigger or action |

Guests can't use webhooks at all, and Users only when developer tools aren't restricted; say so in the description
when it matters.

## 2. Webhook trigger

1. Add the flag to `app/docspace/webhooks/events.js` if it is missing (sorted by value, a comment when the constant
   name differs from the DocSpace event, like `FILE_DELETED` for `file.trashed`).
2. Write the `performList` function that returns the test records for the Zap editor: recent entries of the selected
   place from the API, newest first, at most 100, shaped exactly like the webhook result (same `normalize`). When the
   API has no history of the event (moves), return the recently changed entries and say so in a comment.
3. Define the trigger in `app/zapier/<area>/triggers.js`:

```js
const fileUpdated = createWebhookTrigger(
  "fileUpdated",
  "File Updated",
  "Triggers when a file is changed, for example edited, renamed or restored to an earlier version.",
  [FILE_UPDATED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Leave empty to watch the whole workspace.",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to watch only the top level of the room.",
        key: "folderId",
        label: "Folder",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    performList: performFileUpdated,
    sample: samples.file
  }
)
```

How `hooks.js` uses the options:

- **Mask:** the flags are summed. Several events in one trigger are fine (File Created listens to `file.created` and
  `file.uploaded`).
- **Filters** run on the webhook payload, which keeps the place of the entry before the event:
  - `filters.rootFolderType` keeps only one section: 14 rooms, 5 the Files section;
  - `filters.entryField` names the input field with the id of the entry itself (`roomId` for Room Updated, `formId`
    for Form Submitted and Form Filled Out, where the original form is compared);
  - the parent filter is built in: with `folderId`, or else `id`, set, only direct children of it fire. So the room
    and folder fields must be named `id` and `folderId`.
- **`fetchEntry`** replaces the payload with the API entry for `file.*`, `form.*`, `folder.*` and `room.*` events (the
  payload is the internal entry with other fields). For another entity (users, groups), extend `fetchEntry`. On 403 /
  404 it keeps the payload.
- **`normalize`** shapes the fetched entry (`normalizeFile`: id and title without the extension); the id then goes
  through `normalizeId` for deduplication.
- Subscribing, unsubscribing (a missing webhook is fine), the secret key and the signature check are shared; don't
  copy them.

Texts: label `<Noun> <Event>` in Title Case ("File Moved", "Form Filled Out"); description "Triggers when …."; field
help texts say what empty means ("Leave empty to watch the whole workspace."). Files section variants are separate
triggers with the `InMyDocuments` suffix, `filters: { rootFolderType: 5 }` and the `…InMyDocuments` dropdowns.

## 3. Polling trigger

```js
// Only Full admins and Room admins can subscribe to the `room.created` event,
// so this trigger uses polling.
const roomCreated = {
  display: {
    description: "Triggers when a room is created.",
    label: "Room Created"
  },
  key: "roomCreated",
  noun: "Room",
  operation: {
    canPaginate: true,
    perform: performRoomCreated,
    sample: samples.room
  }
}
```

- Zapier reads only the first page and starts the Zap for every `id` it hasn't seen, so the newest entries must be on
  the first page. Here the order matters, so polling sends `sortBy` (it also becomes the user's default order in
  DocSpace, a known side effect). Merge areas that the default list misses (Form filling rooms are in
  `searchArea=Forms`).
- Ids must be stable: `normalizeId`.
- A polling trigger is often also a dropdown (`roomCreated`, `userAdded`, `userInvited`); keep `canPaginate` and
  `pageFilters` so that dropdowns can load more.

## 4. Hidden trigger for a dropdown

```js
const archivedRoomsList = {
  display: {
    description: "Hidden trigger to get a list of archived rooms.",
    hidden: true,
    label: "List of Archived Rooms"
  },
  key: "archivedRoomsList",
  noun: "Room",
  operation: {
    canPaginate: true,
    perform: async (z, bundle) => { /* one page with pageFilters(bundle), ids through normalizeId */ },
    sample: samples.room
  }
}
```

- Return one page per call with `pageFilters(bundle)`; don't send `sortBy`.
- Read the values of other fields from `bundle.inputData` (the room of a folder list). When a required value is
  missing, return `[]`; an error breaks the dropdown.
- Return objects with the id field and the label field the dropdown names: `dynamic: "archivedRoomsList.id.title"`.
- When the account can't use the list, the field that uses it shows `noRightsField` instead (function field).

## 5. Register, test, document

- Export the trigger, import it in `app/app.js` and add `[x.key]: x` to `triggers` (sorted). Hidden triggers too.
- Add the required registration test to `app/app.test.js`: ``has the `<key>` trigger``, in its section, sorted by
  key, with the import of the definition.
- Unit tests in the area's unit test file (`app/zapier/files/files.unit.test.js`, …):
  - the mask: `checkSubscription(trigger, mask)`;
  - `perform` with `webhookBundle(event, payload, inputData)`: fires for the selected room or folder, stays silent for
    others and for other sections, returns the normalized API entry;
  - `performList` with `fakeZ`; polling and hidden triggers: the request (`count`, `startIndex`, no `sortBy` for
    dropdowns) and the result.
- Integration tests: `performList` / `perform` against the test workspace; subscription is covered in
  `app/zapier/webhooks/webhooks.test.js`.
- Live check after the user confirms: upload, turn on a test Zap, cause the event in DocSpace, check the run in the Zap
  history, turn the Zap off and check in DocSpace developer tools that the webhook is gone.
- README: a row in the triggers table for visible triggers (label, field labels as in Zapier). CHANGELOG:
  `- new <Label> trigger`.
