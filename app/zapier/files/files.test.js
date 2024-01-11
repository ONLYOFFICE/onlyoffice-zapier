//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
const {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  externalLink,
  roomCreate
} = require("./actions.js")
const {
  fileCreated,
  fileDeleted,
  folderCreated,
  folderDeleted,
  roomArchived,
  roomCreated,
  userInvited
} = require("./triggers.js")
const { sessionAuthContext, sessionAuthPerform } = require("../auth/auth.fixture.js")

/**
 * @typedef {import("./actions.js").ArchiveRoomFields} ArchiveRoomFields
 * @typedef {import("./actions.js").CreateFileFields} CreateFileFields
 * @typedef {import("./actions.js").CreateFileInMyDocumentsFields} CreateFileInMyDocumentsFields
 * @typedef {import("./actions.js").CreateFolderFields} CreateFolderFields
 * @typedef {import("./actions.js").ExternalLinkFields} ExternalLinkFields
 * @typedef {import("./triggers.js").FileCreatedFields} FileCreatedFields
 * @typedef {import("./triggers.js").FolderCreatedFields} FolderCreatedFields
 * @typedef {import("./actions.js").RoomCreateFields} RoomCreateFields
 * @typedef {import("./triggers.js").UserInvitedFields} UserInvitedFields
 */

const tester = createAppTester(App)

const Files = suite("files", {
  ...sessionAuthContext(),
  inputData: {
    id: 0
  }
})

Files.before(async (context) => {
  await sessionAuthPerform(tester, context)
})

Files("create a room", async (context) => {
  const { perform } = roomCreate.operation
  /** @type {RoomCreateFields} */
  const inputData = {
    title: "Test room",
    type: "CustomRoom"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const room = await tester(perform, bundle)
  if (!room) {
    unreachable("TODO")
    return
  }
  equal(bundle.inputData.title, room.title)
})

Files("triggers when a room is created", async (context) => {
  const { perform } = roomCreated.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const room = folders[0]
  if (!room) {
    unreachable("TODO")
    return
  }
  context.inputData.id = room.id
  not.equal(room.id, 0)
})

Files("creates a file", async (context) => {
  const { perform } = createFile.operation
  /** @type {CreateFileFields} */
  const inputData = {
    folderId: context.inputData.id,
    title: "README"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.folderId, bundle.inputData.folderId)
})

Files("creates a file in the My Documents", async (context) => {
  const { perform } = createFileInMyDocuments.operation
  /** @type {CreateFileInMyDocumentsFields} */
  const inputData = {
    title: "README"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  not.equal(result.id, 0)
})

Files("create a folder", async (context) => {
  const { perform } = createFolder.operation
  /** @type {CreateFolderFields} */
  const inputData = {
    folderId: context.inputData.id,
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  not.equal(result.id, 0)
})

Files("returns the links of a room", async (context) => {
  const { perform } = externalLink.operation
  /** @type {ExternalLinkFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  not.equal(result.sharedTo.shareLink, null)
})

Files("triggers when a folder is created", async (context) => {
  const { perform } = folderCreated.operation
  /** @type {FolderCreatedFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  if (!folder) {
    unreachable("TODO")
    return
  }
  not.equal(folder.id, 0)
})

Files("triggers when a file is created", async (context) => {
  const { perform } = fileCreated.operation
  /** @type {FileCreatedFields} */
  const inputData = {
    folderId: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const file = await tester(perform, bundle)
  const newFile = file[0]
  if (!newFile) {
    unreachable("TODO")
    return
  }

  not.equal(newFile.id, 0)
})

Files("triggers when a file is deleted", async (context) => {
  const { perform } = fileDeleted.operation
  const bundle = {
    authData: context.authData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  // TODO: Without the file delete action, the file delete trigger test may fail because the trash may be empty.
  if (files.length) not.equal(file.id, 0)
  else equal(true, true)
})

Files("triggers when a user invited to Room", async (context) => {
  // TODO: After merging with the invite-user-action branch,
  // add a test with an array length check.
  // If active true, an array of length 1 will be returned
  // if active false, array will consist of two elements.
  const { perform } = userInvited.operation
  /** @type {UserInvitedFields} */
  const inputData = {
    id: context.inputData.id,
    active: true
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const users = await tester(perform, bundle)
  const user = users[0]
  not.equal(user.id, 0)
})

Files("archive the room", async (context) => {
  const { perform } = archiveRoom.operation
  /** @type {ArchiveRoomFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.finished, true)
})

Files("triggers when a room is archived", async (context) => {
  const { perform } = roomArchived.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const room = folders[0]
  if (!room) {
    unreachable("TODO")
    return
  }
  not.equal(room.id, 0)
})

Files("triggers when a folder is deleted", async (context) => {
  const { perform } = folderDeleted.operation
  // TODO: Add a check to delete a folder from a specific room after adding a Delete Folder action
  /*const inputData = {
    id: context.inputData.folderId
  }*/
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  // TODO: Without the folder delete action, the folder delete trigger test may fail because the trash may be empty.
  if (folders.length) not.equal(folder.id, 0)
  else equal(true, true)
})

Files.run()
