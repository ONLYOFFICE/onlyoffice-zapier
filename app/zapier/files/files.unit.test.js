//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// These tests use a fake `z` object, so they don't need a workspace.

const { equal, instance, match } = require("uvu/assert")
const { test } = require("uvu")
const {
  archiveRoom,
  copyFile,
  copyFolder,
  deleteFile,
  downloadFile,
  getFile,
  getRoom,
  getRoomMembers,
  inviteGuest,
  moveFile,
  moveFolder,
  removeUserFromRoom,
  renameFile,
  renameFolder,
  roomCreate,
  shareRoom,
  unarchiveRoom
} = require("./actions.js")
const { authData, fakeZ, HaltedError, webhookBundle } = require("../z.fixture.js")
const {
  archivedRoomsList,
  fileCreated,
  fileMoved,
  fileUpdated,
  folderMoved,
  foldersList,
  folderUpdated,
  formFilledOut,
  formSubmitted,
  roomCreated,
  roomsFiltered,
  roomUpdated,
  shareRoles,
  userInvited
} = require("./triggers.js")
const { pageFilters } = require("../pagination.js")
const { searchFile, searchRoom } = require("./searches.js")

/**
 * @param {any} fn
 * @param {any} z
 * @param {any} bundle
 * @returns {Promise<any>}
 */
function run(fn, z, bundle) {
  return fn(z, { authData, ...bundle })
}

/**
 * @param {() => Promise<any>} fn
 * @returns {Promise<unknown>}
 */
async function caught(fn) {
  try {
    await fn()
  } catch (error) {
    return error
  }
}

/**
 * @param {any[]} items
 * @param {string} key
 * @returns {any[]}
 */
function pluck(items, key) {
  return items.map((item) => item[key])
}

/**
 * @param {number} id
 * @param {number} roomType
 * @param {string} created
 * @returns {Object}
 */
function room(id, roomType, created) {
  return { created, id, roomType }
}

test("requests the page that zapier asks for", () => {
  // @ts-ignore: only the page is used.
  equal(pageFilters({ meta: { page: 2 } }), { count: 100, startIndex: 200 })
  // @ts-ignore: polling doesn't pass the page.
  equal(pageFilters({}), { count: 100, startIndex: 0 })
})

test("fails archiving when the operation fails", async () => {
  const operation = { error: "Access denied", finished: true, id: "op", progress: 100 }
  const z = fakeZ({
    "GET /files/fileops": [operation],
    "PUT /files/rooms/1/archive": { error: "", finished: false, id: "op", progress: 0 }
  })
  const error = await caught(() => run(archiveRoom.operation.perform, z, { inputData: { id: 1 } }))
  instance(error, HaltedError)
  equal(/** @type {Error} */ (error).message, "Access denied")
})

test("creates a room with a numeric type", async () => {
  const z = fakeZ({ "POST /files/rooms": { id: 1 } })
  await run(roomCreate.operation.perform, z, { inputData: { roomType: "8", title: "VDR" } })
  equal(z.calls[0].body, { roomType: 8, title: "VDR" })
})

test("returns the user of the shared room", async () => {
  const user = { email: "a@example.com", id: "u1" }
  const member = { sharedTo: { id: "old" }, sharedToUser: user }
  const z = fakeZ({ "PUT /files/rooms/1/share": { members: [member] } })
  const inputData = { access: 10, roomId: 1, userId: "u1" }
  const result = await run(shareRoom.operation.perform, z, { inputData })
  equal(result, user)
})

test("dehydrates the downloaded file by its id", async () => {
  const z = fakeZ({})
  const result = await run(downloadFile.operation.perform, z, { inputData: { fileId: 7 } })
  match(result.file, "\"fileId\":7")
  equal(z.calls.length, 0)
})

test("invites a guest whose email is a substring of a member email", async () => {
  let shared = false
  const z = fakeZ({
    "GET /files/rooms/1/share": () => {
      if (shared) {
        return [{ sharedToUser: { email: "a@example.com" } }]
      }
      return [{ sharedToUser: { email: "aa@example.com" } }]
    },
    "PUT /files/rooms/1/share": () => {
      shared = true
      return { members: [] }
    }
  })
  const inputData = { access: 11, email: "A@example.com", roomId: 1 }
  const result = await run(inviteGuest.operation.perform, z, { inputData })
  equal(result.status, "Invited")
})

test("doesn't invite a guest who is already a member", async () => {
  const z = fakeZ({ "GET /files/rooms/1/share": [{ sharedToUser: { email: "a@example.com" } }] })
  const inputData = { access: 11, email: "a@example.com", roomId: 1 }
  const result = await run(inviteGuest.operation.perform, z, { inputData })
  equal(result.status, "User is already a member")
  equal(z.calls.length, 1)
})

test("keeps titles of files without an extension", async () => {
  const files = [
    { id: "1", title: "README" },
    { id: "2", title: "report.docx" },
    { id: "sbox-1-abc", title: "box.xlsx" }
  ]
  const z = fakeZ({ "GET /files/7": { files } })
  // @ts-ignore: performList exists for webhook triggers.
  const result = await run(fileCreated.operation.performList, z, { inputData: { id: 7 } })
  equal(pluck(result, "title"), [
    "README",
    "report",
    "box"
  ])
  equal(pluck(result, "id"), [
    1,
    2,
    "sbox-1-abc"
  ])
})

test("lists form filling rooms with the other rooms", async () => {
  const forms = [room(3, 1, "2026-10-03T00:00:00Z")]
  const rooms = [
    room(2, 5, "2026-10-02T00:00:00Z"),
    room(1, 2, "2026-10-01T00:00:00Z")
  ]
  const z = fakeZ({
    "GET /files/rooms": (request) => {
      if (request.query.searchArea === "Forms") {
        return { folders: forms }
      }
      return { folders: rooms }
    }
  })
  const result = await run(roomCreated.operation.perform, z, {})
  equal(pluck(result, "id"), [
    3,
    2,
    1
  ])
  equal(z.calls[0].query.sortBy, "DateAndTimeCreation")
})

test("lists only rooms with external links", async () => {
  const rooms = [
    room(1, 2, "2026-10-06T00:00:00Z"),
    room(2, 5, "2026-10-05T00:00:00Z"),
    room(3, 6, "2026-10-04T00:00:00Z"),
    room(4, 8, "2026-10-03T00:00:00Z"),
    room(5, 9, "2026-10-02T00:00:00Z"),
    room(6, 1, "2026-10-01T00:00:00Z")
  ]
  const z = fakeZ({
    "GET /files/rooms": (request) => {
      if (request.query.searchArea === "Forms") {
        return { folders: [] }
      }
      return { folders: rooms }
    }
  })
  const result = await run(roomsFiltered.operation.perform, z, {})
  equal(pluck(result, "roomType"), [
    5,
    6,
    1
  ])
})

test("lists no folders until a room or folder is selected", async () => {
  const z = fakeZ({})
  equal(await run(foldersList.operation.perform, z, { inputData: {} }), [])
  equal(z.calls.length, 0)
})

test("returns room members without groups", async () => {
  const z = fakeZ({
    "GET /files/rooms/5/share": [
      { sharedToUser: { activationStatus: 1, email: "a@example.com", id: "u1" } },
      { sharedTo: { id: "g1", name: "Group" } },
      { sharedToUser: { activationStatus: 2, email: "b@example.com", id: "u2" } }
    ]
  })
  const all = await run(userInvited.operation.perform, z, { inputData: { active: "false", id: 5 } })
  equal(pluck(all, "id"), [
    "u1",
    "u2"
  ])
  const active = await run(userInvited.operation.perform, z, { inputData: { active: "true", id: 5 } })
  equal(pluck(active, "id"), ["u1"])
})

test("offers the room manager role to the workspace owner", async () => {
  const z = fakeZ({
    "GET /files/rooms/5": { id: 5, roomType: 8 },
    "GET /people/@self": { isOwner: true },
    "GET /people/u1": { id: "u1", isAdmin: false, isOwner: true, isRoomAdmin: false }
  })
  const roles = await run(shareRoles.operation.perform, z, { inputData: { roomId: 5, userId: "u1" } })
  equal(pluck(roles, "name"), [
    "Room manager",
    "Content creator",
    "Editor",
    "Viewer",
    "Form filler"
  ])
})

test("searches the first page if the server search finds nothing", async () => {
  const files = [
    { id: 1, title: "Test File.docx" },
    { id: 2, title: "Other.docx" }
  ]
  const z = fakeZ({
    "GET /files/9": (request) => {
      if (request.query.filterValue) {
        return { files: [] }
      }
      return { files }
    }
  })
  const result = await run(searchFile.operation.perform, z, { inputData: { folderId: 9, title: "test file" } })
  equal(pluck(result, "id"), [1])
  equal(z.calls.length, 2)
})

/**
 * @param {any} trigger
 * @param {number} mask
 */
async function checkSubscription(trigger, mask) {
  const z = fakeZ({ "POST /settings/webhook": { id: 1 } })
  await run(trigger.operation.performSubscribe, z, { inputData: {}, targetUrl: "https://hooks.zapier.com/1" })
  equal(z.calls[0].body.triggers, mask)
}

test("file updated trigger subscribes to the file.updated event", async () => {
  await checkSubscription(fileUpdated, 512)
})

test("file updated trigger fires for files of the selected folder", async () => {
  const z = fakeZ({ "GET /files/file/7": { folderId: 3, id: 7, title: "Report.docx" } })
  const payload = { id: 7, parentId: 3, rootFolderType: 14, title: "Report.docx" }
  const perform = /** @type {any} */ (fileUpdated.operation.perform)
  const files = await perform(z, webhookBundle("file.updated", payload, { folderId: "3", id: "1" }))
  equal(pluck(files, "title"), ["Report"])
  equal(await perform(z, webhookBundle("file.updated", payload, { folderId: "4", id: "1" })), [])
  equal((await perform(z, webhookBundle("file.updated", payload))).length, 1)
})

test("file updated trigger lists the files section if nothing is selected", async () => {
  const z = fakeZ({
    "GET /files/10": { files: [{ id: 2, title: "Report.docx" }] },
    "GET /files/@my": { pathParts: [{ id: 10, title: "Files" }] }
  })
  const performList = /** @type {any} */ (fileUpdated.operation.performList)
  const files = await run(performList, z, { inputData: {} })
  equal(pluck(files, "title"), ["Report"])
  equal(z.calls[1].query.sortBy, "DateAndTime")
})

test("file moved trigger subscribes to the file.moved event", async () => {
  await checkSubscription(fileMoved, 16384)
})

test("file moved trigger fires for files moved to the selected folder", async () => {
  const z = fakeZ({ "GET /files/file/7": { folderId: 4, id: 7, title: "Report.docx" } })
  const payload = { id: 7, parentId: 4, rootFolderType: 14, title: "Report.docx" }
  const perform = /** @type {any} */ (fileMoved.operation.perform)
  const files = await perform(z, webhookBundle("file.moved", payload, { folderId: "4", id: "1" }))
  equal(pluck(files, "id"), [7])
  equal(await perform(z, webhookBundle("file.moved", payload, { folderId: "3", id: "1" })), [])
})

test("folder updated trigger subscribes to the folder.updated event", async () => {
  await checkSubscription(folderUpdated, 65536)
})

test("folder updated trigger fires for folders of the selected room", async () => {
  const z = fakeZ({ "GET /files/folder/8": { id: 8, parentId: 1, title: "Reports" } })
  const payload = { id: 8, parentId: 1, rootFolderType: 14, title: "Reports" }
  const perform = /** @type {any} */ (folderUpdated.operation.perform)
  const folders = await perform(z, webhookBundle("folder.updated", payload, { id: "1" }))
  equal(pluck(folders, "title"), ["Reports"])
  equal(await perform(z, webhookBundle("folder.updated", payload, { id: "2" })), [])
})

test("folder updated trigger lists the files section if nothing is selected", async () => {
  const z = fakeZ({
    "GET /files/10": { folders: [{ id: "3", title: "Reports" }] },
    "GET /files/@my": { pathParts: [{ id: 10, title: "Files" }] }
  })
  const performList = /** @type {any} */ (folderUpdated.operation.performList)
  const folders = await run(performList, z, { inputData: {} })
  equal(pluck(folders, "id"), [3])
  equal(z.calls[1].query.filterType, "FoldersOnly")
})

test("folder moved trigger subscribes to the folder.moved event", async () => {
  await checkSubscription(folderMoved, 2097152)
})

test("folder moved trigger fires for folders moved to the selected folder", async () => {
  const z = fakeZ({ "GET /files/folder/8": { id: 8, parentId: 4, title: "Reports" } })
  const payload = { id: 8, parentId: 4, rootFolderType: 14, title: "Reports" }
  const perform = /** @type {any} */ (folderMoved.operation.perform)
  const folders = await perform(z, webhookBundle("folder.moved", payload, { folderId: "4", id: "1" }))
  equal(pluck(folders, "id"), [8])
  equal(await perform(z, webhookBundle("folder.moved", payload, { id: "1" })), [])
})

test("room updated trigger subscribes to the room.updated event", async () => {
  await checkSubscription(roomUpdated, 8388608)
})

test("room updated trigger fires only for the selected room", async () => {
  const z = fakeZ({ "GET /files/rooms/5": { id: 5, roomType: 2, title: "Sales" } })
  const payload = { id: 5, parentId: 1, rootFolderType: 14, title: "Sales" }
  const perform = /** @type {any} */ (roomUpdated.operation.perform)
  const rooms = await perform(z, webhookBundle("room.updated", payload, { roomId: "5" }))
  equal(pluck(rooms, "roomType"), [2])
  equal(await perform(z, webhookBundle("room.updated", payload, { roomId: "6" })), [])
  equal((await perform(z, webhookBundle("room.updated", payload))).length, 1)
})

test("room updated trigger returns the selected room for samples", async () => {
  const z = fakeZ({ "GET /files/rooms/5": { id: "5", title: "Sales" } })
  const performList = /** @type {any} */ (roomUpdated.operation.performList)
  equal(pluck(await run(performList, z, { inputData: { roomId: "5" } }), "id"), [5])
})

test("form submitted trigger subscribes to the form.submit event", async () => {
  await checkSubscription(formSubmitted, 268435456)
})

test("form submitted trigger returns the filled form with the original form", async () => {
  const z = fakeZ({
    "GET /files/file/5": { folderId: 3, id: 5, title: "Application.pdf" },
    "GET /files/file/6": { folderId: 9, id: 6, title: "Application - John Doe.pdf" }
  })
  const payload = {
    originalForm: { id: 5, parentId: 3, rootFolderType: 14, title: "Application.pdf" },
    submittedForm: { id: 6, parentId: 9, rootFolderType: 14, title: "Application - John Doe.pdf" }
  }
  const perform = /** @type {any} */ (formSubmitted.operation.perform)
  const forms = await perform(z, webhookBundle("form.submit", payload, { formId: "5", id: "3" }))
  equal(pluck(forms, "id"), [6])
  equal(forms[0].title, "Application - John Doe")
  equal(forms[0].originalForm.title, "Application")
  equal(await perform(z, webhookBundle("form.submit", payload, { formId: "4" })), [])
  equal(await perform(z, webhookBundle("form.submit", payload, { id: "8" })), [])
})

test("form submitted trigger returns no original form if the event has none", async () => {
  const z = fakeZ({ "GET /files/file/6": { folderId: 9, id: 6, title: "Application - John Doe.pdf" } })
  const payload = { submittedForm: { id: 6, parentId: 9, title: "Application - John Doe.pdf" } }
  const perform = /** @type {any} */ (formSubmitted.operation.perform)
  const forms = await perform(z, webhookBundle("form.submit", payload))
  equal(pluck(forms, "title"), ["Application - John Doe"])
  equal(Object.hasOwn(forms[0], "originalForm"), false)
})

test("form submitted trigger lists the filled forms with their original forms", async () => {
  const z = fakeZ({
    "GET /files/12": {
      folders: [
        { id: 20, originalFormId: 5, type: 25 },
        { id: 21, originalFormId: 7, type: 25 }
      ]
    },
    "GET /files/20": {
      files: [
        { created: "2026-01-02T00:00:00Z", fileExst: ".xlsx", id: 9, title: "Application.xlsx" },
        { created: "2026-01-02T00:00:00Z", fileExst: ".pdf", id: 6, title: "Application - John Doe.pdf" }
      ]
    },
    "GET /files/21": {
      files: [{ created: "2026-01-03T00:00:00Z", fileExst: ".pdf", id: 8, title: "Order - Jane Doe.pdf" }]
    },
    "GET /files/3": {
      folders: [
        { id: 11, type: 26 },
        { id: 12, type: 25 }
      ]
    },
    "GET /files/file/5": { folderId: 3, id: 5, title: "Application.pdf" },
    "GET /files/file/7": { folderId: 4, id: 7, title: "Order.pdf" }
  })
  const performList = /** @type {any} */ (formSubmitted.operation.performList)
  const forms = await run(performList, z, { inputData: { id: "3" } })
  equal(pluck(forms, "title"), ["Application - John Doe"])
  equal(forms[0].originalForm.title, "Application")
  equal(pluck(await run(performList, z, { inputData: { folderId: "4", id: "3" } }), "id"), [8])
  equal(await run(performList, z, { inputData: { formId: "7", id: "3" } }), [])
  equal(await run(performList, z, { inputData: {} }), [])
})

test("form filled out trigger subscribes to the form.filled.out event", async () => {
  await checkSubscription(formFilledOut, 536870912)
})

test("form filled out trigger returns the filled out form", async () => {
  const z = fakeZ({ "GET /files/file/5": { folderId: 3, formFillingStatus: 4, id: 5, title: "Contract.pdf" } })
  const payload = { id: 5, parentId: 3, rootFolderType: 14, title: "Contract.pdf" }
  const perform = /** @type {any} */ (formFilledOut.operation.perform)
  const forms = await perform(z, webhookBundle("form.filled.out", payload, { formId: "5", id: "3" }))
  equal(pluck(forms, "title"), ["Contract"])
  equal(await perform(z, webhookBundle("form.filled.out", payload, { formId: "4" })), [])
  equal(await perform(z, webhookBundle("form.filled.out", payload, { id: "8" })), [])
})

test("form filled out trigger lists only filled out forms", async () => {
  const z = fakeZ({
    "GET /files/3": {
      files: [
        { formFillingStatus: 3, id: 6, title: "Draft.pdf" },
        { formFillingStatus: 4, id: 5, title: "Contract.pdf" }
      ]
    }
  })
  const performList = /** @type {any} */ (formFilledOut.operation.performList)
  equal(pluck(await run(performList, z, { inputData: { id: "3" } }), "id"), [5])
  equal(await run(performList, z, { inputData: { formId: "6", id: "3" } }), [])
  equal(await run(performList, z, { inputData: {} }), [])
})

test("finds the recently changed room first without sorting in the request", async () => {
  const rooms = [
    { id: 1, title: "Sales", updated: "2026-01-01T00:00:00Z" },
    { id: 2, title: "Sales Q4", updated: "2026-02-01T00:00:00Z" }
  ]
  const z = fakeZ({ "GET /files/rooms": (call) => ({ folders: call.query.searchArea === "Forms" ? [] : rooms }) })
  const found = await run(searchRoom.operation.perform, z, { inputData: { title: "sales" } })
  equal(pluck(found, "id"), [
    2,
    1
  ])
  equal(z.calls[0].query.sortBy, undefined)
})

test("finds rooms by title, including form filling rooms", async () => {
  const forms = [
    { id: 2, roomType: 1, title: "Sales forms" },
    { id: 1, roomType: 2, title: "Sales" }
  ]
  const active = [{ id: "1", roomType: 2, title: "Sales" }]
  const z = fakeZ({
    "GET /files/rooms": (call) => ({ folders: call.query.searchArea === "Forms" ? forms : active })
  })
  const rooms = await run(searchRoom.operation.perform, z, { inputData: { title: "sales" } })
  const ids = pluck(rooms, "id")
  equal(ids, [
    1,
    2
  ])
  equal(z.calls[0].query.filterValue, "sales")
})

test("gets a file by id without the extension in the title", async () => {
  const z = fakeZ({ "GET /files/file/7": { fileExst: ".docx", id: "7", title: "Report.docx" } })
  const file = await run(getFile.operation.perform, z, { inputData: { fileId: "7" } })
  equal(file.id, 7)
  equal(file.title, "Report")
  equal(file.fileExst, ".docx")
})

test("keeps the ids of a file and a room in third-party storage", async () => {
  const z = fakeZ({
    "GET /files/file/sbox-7": { id: "sbox-7", title: "Report.docx" },
    "GET /files/rooms/sbox-5": { id: "sbox-5", title: "Box" }
  })
  equal((await run(getFile.operation.perform, z, { inputData: { fileId: "sbox-7" } })).id, "sbox-7")
  equal((await run(getRoom.operation.perform, z, { inputData: { id: "sbox-5" } })).id, "sbox-5")
})

test("gets a room by id", async () => {
  const z = fakeZ({ "GET /files/rooms/5": { id: "5", roomType: 2, title: "Sales" } })
  const room = await run(getRoom.operation.perform, z, { inputData: { id: "5" } })
  equal(room.id, 5)
  equal(room.title, "Sales")
})

test("deletes a file in third-party storage", async () => {
  const operation = { finished: true, id: "op", progress: 100 }
  const z = fakeZ({ "DELETE /files/file/sbox-7": [operation], "GET /files/fileops": [operation] })
  await run(deleteFile.operation.perform, z, { inputData: { fileId: "sbox-7" } })
  equal(z.calls[0].path, "/files/file/sbox-7")
})

test("deletes a file and waits for the operation", async () => {
  const operation = { finished: true, id: "op", progress: 100 }
  const z = fakeZ({
    "DELETE /files/file/7": [operation],
    "GET /files/fileops": [operation]
  })
  const result = await run(deleteFile.operation.perform, z, { inputData: { fileId: "7", immediately: "true" } })
  equal(result.finished, true)
  equal(z.calls[0].body, { deleteAfter: false, immediately: true })
})

test("fails deleting a file when the operation fails", async () => {
  const operation = { error: "Access denied", finished: true, id: "op", progress: 100 }
  const z = fakeZ({
    "DELETE /files/file/7": [operation],
    "GET /files/fileops": [operation]
  })
  const error = await caught(() => run(deleteFile.operation.perform, z, { inputData: { fileId: "7" } }))
  instance(error, HaltedError)
  equal(z.calls[0].body.immediately, false)
})

test("renames a file in third-party storage", async () => {
  const z = fakeZ({ "PUT /files/file/sbox-7": { id: "sbox-7", title: "Contract.docx" } })
  const file = await run(renameFile.operation.perform, z, { inputData: { fileId: "sbox-7", title: "Contract" } })
  equal(file.id, "sbox-7")
})

test("renames a file", async () => {
  const z = fakeZ({ "PUT /files/file/7": (call) => ({ id: 7, title: `${call.body.title}.docx` }) })
  const file = await run(renameFile.operation.perform, z, { inputData: { fileId: "7", title: "Contract" } })
  equal(file.title, "Contract")
  equal(z.calls[0].body, { title: "Contract" })
})

test("renames a folder in third-party storage", async () => {
  const z = fakeZ({ "PUT /files/folder/sbox-8": { id: "sbox-8", title: "Reports" } })
  const folder = await run(renameFolder.operation.perform, z, { inputData: { folderId: "sbox-8", title: "Reports" } })
  equal(folder.id, "sbox-8")
})

test("renames a folder", async () => {
  const z = fakeZ({ "PUT /files/folder/8": (call) => ({ id: "8", title: call.body.title }) })
  const folder = await run(renameFolder.operation.perform, z, { inputData: { folderId: "8", title: "Reports" } })
  equal(folder.id, 8)
  equal(folder.title, "Reports")
})

test("copies a file in third-party storage", async () => {
  const operation = { files: [{ id: "sbox-9", title: "Report.docx" }], finished: true, id: "op", progress: 100 }
  const z = fakeZ({ "GET /files/fileops": [operation], "PUT /files/fileops/copy": [operation] })
  const inputData = { destinationRoomId: "sbox-3", fileId: "sbox-7" }
  const file = await run(copyFile.operation.perform, z, { inputData })
  equal(file.id, "sbox-9")
  equal(z.calls[0].body.fileIds, ["sbox-7"])
  equal(z.calls[0].body.destFolderId, "sbox-3")
})

test("copies a file and returns the copy", async () => {
  const operation = { files: [{ id: "9", title: "Report.docx" }], finished: true, id: "op", progress: 100 }
  const z = fakeZ({
    "GET /files/fileops": [operation],
    "PUT /files/fileops/copy": [operation]
  })
  const inputData = { destinationFolderId: "4", destinationRoomId: "3", fileId: "7" }
  const file = await run(copyFile.operation.perform, z, { inputData })
  equal(file.id, 9)
  equal(file.title, "Report")
  equal(z.calls[0].body, {
    conflictResolveType: 2,
    deleteAfter: false,
    destFolderId: 4,
    fileIds: [7],
    folderIds: []
  })
})

test("moves a folder to the top level of the destination room", async () => {
  const operation = { finished: true, folders: [{ id: "8", title: "Reports" }], id: "op", progress: 100 }
  const z = fakeZ({
    "GET /files/fileops": [operation],
    "PUT /files/fileops/move": [operation]
  })
  const inputData = { conflict: "1", destinationRoomId: "3", folderId: "8" }
  const folder = await run(moveFolder.operation.perform, z, { inputData })
  equal(folder.id, 8)
  equal(z.calls[0].body.destFolderId, 3)
  equal(z.calls[0].body.folderIds, [8])
  equal(z.calls[0].body.conflictResolveType, 1)
})

test("copies a folder and returns the copy", async () => {
  const folders = [
    { id: 3, title: "Sales" },
    { id: "10", title: "Reports" }
  ]
  const operation = { finished: true, folders, id: "op", progress: 100 }
  const z = fakeZ({
    "GET /files/fileops": [operation],
    "PUT /files/fileops/copy": [operation]
  })
  const inputData = { destinationRoomId: "3", folderId: "8" }
  const folder = await run(copyFolder.operation.perform, z, { inputData })
  equal(folder.id, 10)
  equal(z.calls[0].body.folderIds, [8])
})

test("fails moving a file that was skipped", async () => {
  const operation = { files: [], finished: true, id: "op", progress: 100 }
  const z = fakeZ({
    "GET /files/fileops": [operation],
    "PUT /files/fileops/move": [operation]
  })
  const inputData = { conflict: "0", destinationRoomId: "3", fileId: "7" }
  instance(await caught(() => run(moveFile.operation.perform, z, { inputData })), HaltedError)
})

test("lists the archived rooms without sorting in the request", async () => {
  const z = fakeZ({ "GET /files/rooms": { folders: [{ id: "5", title: "Sales" }] } })
  const rooms = await run(archivedRoomsList.operation.perform, z, {})
  equal(pluck(rooms, "id"), [5])
  equal(z.calls[0].query.searchArea, "Archive")
  equal(z.calls[0].query.sortBy, undefined)
})

test("unarchives a room and returns it", async () => {
  const operation = { finished: true, id: "op", progress: 100 }
  const z = fakeZ({
    "GET /files/fileops": [operation],
    "GET /files/rooms/5": { id: "5", rootFolderType: 14, title: "Sales" },
    "PUT /files/rooms/5/unarchive": operation
  })
  const room = await run(unarchiveRoom.operation.perform, z, { inputData: { id: "5" } })
  equal(room.id, 5)
  equal(room.rootFolderType, 14)
})

test("removes a user from a room", async () => {
  const z = fakeZ({
    "GET /files/rooms/5/share": [{ sharedToUser: { id: "owner" } }],
    "PUT /files/rooms/5/share": { error: 0, members: [] }
  })
  const result = await run(removeUserFromRoom.operation.perform, z, { inputData: { id: "5", userId: "u1" } })
  equal(result, { roomId: 5, status: "Removed", userId: "u1" })
  equal(z.calls[0].body.invitations, [{ access: 0, id: "u1" }])
})

test("fails removing a user who is still a member", async () => {
  const z = fakeZ({
    "GET /files/rooms/5/share": [{ sharedToUser: { id: "owner" } }],
    "PUT /files/rooms/5/share": { error: 0, members: [] }
  })
  const inputData = { id: "5", userId: "owner" }
  instance(await caught(() => run(removeUserFromRoom.operation.perform, z, { inputData })), HaltedError)
})

test("gets the members of a room page by page", async () => {
  const owner = { access: 1, isOwner: true, sharedToUser: { displayName: "Owner", email: "o@e.com", id: "o" } }
  const viewer = { access: 2, isOwner: false, sharedToUser: { displayName: "Viewer", email: "v@e.com", id: "v" } }
  const group = { access: 10, isOwner: false, sharedToGroup: { id: "g", name: "Team" } }
  const z = fakeZ({
    "GET /files/rooms/5/share": (call) => {
      if (call.query.startIndex === "0") {
        return Array.from({ length: 100 }, () => viewer)
      }
      return [
        owner,
        group
      ]
    }
  })
  const result = await run(getRoomMembers.operation.perform, z, { inputData: { id: "5" } })
  equal(result.roomId, 5)
  equal(result.count, 102)
  equal(z.calls.length, 2)
  equal(result.members[0].role, "Viewer")
  equal(result.members[100].role, "Owner")
  equal(result.members[101], { access: 10, displayName: "Team", email: "", id: "g", role: "Editor", type: "Group" })
})

test.run()
