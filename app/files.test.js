//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { equal, not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { createAppTester } = require("zapier-platform-core")
const { App } = require("./app.js")
const { sessionAuthContext, sessionAuthPerform } = require("./auth.fixture.js")
const {
  createFile,
  createFileInMyDocuments,
  roomCreated,
  createFolder,
  archiveRoom,
  roomCreate,
  folderCreated
} = require("./files.js")

const tester = createAppTester(App)

const Files = suite("files", {
  ...sessionAuthContext(),
  inputData: {
    folderId: 0
  }
})

Files.before(async (context) => {
  await sessionAuthPerform(tester, context)
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
  context.inputData.folderId = room.id
  not.equal(room.id, 0)
})

Files("creates a file", async (context) => {
  const { perform } = createFile.operation
  /** @type {RegularFile} */
  const inputData = {
    folderId: context.inputData.folderId,
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
  not.equal(result.folderId, 0)
})

Files("create a folder", async (context) => {
  const { perform } = createFolder.operation
  /** @type {FolderOptions} */
  const inputData = {
    folderId: context.inputData.folderId,
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  not.equal(result.id, 0)
})

Files("archive the room", async (context) => {
  const { perform } = archiveRoom.operation
  /** @type {RoomData} */
  const inputData = {
    id: context.inputData.folderId,
    title: "TODO"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.finished, true)
})

Files("create a room", async (context) => {
  const { perform } = roomCreate.operation
  /** @type {RoomOptions} */
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

Files("triggers when a folder is created", async (context) => {
  const { perform } = folderCreated.operation
  const inputData = {
    folderId: context.inputData.folderId,
    title: "Test Folder"
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

Files.run()
