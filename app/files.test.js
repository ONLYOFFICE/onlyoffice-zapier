//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { equal, not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { createAppTester } = require("zapier-platform-core")
const { App } = require("./app.js")
const { sessionAuthContext, sessionAuthPerform } = require("./auth.fixture.js")
const { createFile, createFileInMyDocuments, roomCreated, uploadFile } = require("./files.js")

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

Files("upload a file", async (context) => {
  const { perform } = uploadFile.operation
  /** @type {UploadFileOptions} */
  const inputData = {
    folderId: context.inputData.folderId,
    title: "File from Zapier",
    url: "https://github.com/ONLYOFFICE/document-templates/raw/master/sample/sample.docx"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  not.equal(result.id, 0)
})

Files.run()
