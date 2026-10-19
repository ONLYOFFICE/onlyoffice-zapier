//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// These tests use a fake `z` object, so they don't need a workspace.

const { equal, instance, match } = require("uvu/assert")
const { test } = require("uvu")
const {
  archiveRoom,
  downloadFile,
  inviteGuest,
  roomCreate,
  shareRoom
} = require("./actions.js")
const { authData, fakeZ, HaltedError, webhookBundle } = require("../z.fixture.js")
const {
  fileCreated,
  fileMoved,
  fileUpdated,
  foldersList,
  folderUpdated,
  roomCreated,
  roomsFiltered,
  shareRoles,
  userInvited
} = require("./triggers.js")
const { pageFilters } = require("../pagination.js")
const { searchFile } = require("./searches.js")

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

test.run()
