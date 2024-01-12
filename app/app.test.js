//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { join } = require("node:path")
const { readFile } = require("node:fs/promises")
const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { App } = require("./app.js")
const {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  deleteFolder,
  downloadFile,
  externalLink,
  roomCreate,
  shareRoom,
  uploadFile
} = require("./zapier/files/actions.js")
const { beforeSessionAuthRequest } = require("./docspase/auth/auth.js")
const {
  fileCreated,
  fileDeleted,
  filesList,
  filteredSections,
  folderCreated,
  folderDeleted,
  roomArchived,
  roomCreated,
  shareRoles,
  userInvited
} = require("./zapier/files/triggers.js")
const { inviteUser } = require("./zapier/people/actions.js")
const {
  searchFile,
  searchFolder
} = require("./zapier/files/searches.js")
const pack = require("../package.json")
const { sessionAuth } = require("./zapier/auth/auth.js")
const { userAdded } = require("./zapier/people/triggers.js")

test("has the actual version", () => {
  const version = "0.0.1"
  equal(App.version, version)
  equal(pack.version, version)
})

test("has the actual platform version", async () => {
  const version = "15.5.0"
  const file = join(__dirname, "../.zapier-version")
  const content = await readFile(file, { encoding: "utf-8" })
  equal(App.platformVersion, version)
  equal(pack.dependencies["zapier-platform-core"], version)
  equal(content.trim(), version)
})

test("has session authentication", () => {
  const hasHandler = App.authentication === sessionAuth
  const hasHooks = beforeSessionAuthRequest.every((handler) => (
    App.beforeRequest.includes(handler)
  ))
  equal(hasHandler, true)
  equal(hasHooks, true)
})

// Triggers

test("has the `fileCreated` trigger", () => {
  const has = App.triggers[fileCreated.key] === fileCreated
  equal(has, true)
})

test("has the `fileDeleted` trigger", () => {
  const has = App.triggers[fileDeleted.key] === fileDeleted
  equal(has, true)
})

test("has the `filesList` trigger", () => {
  const has = App.triggers[filesList.key] === filesList
  equal(has, true)
})

test("has the `filteredSections` trigger", () => {
  const has = App.triggers[filteredSections.key] === filteredSections
  equal(has, true)
})

test("has the `folderCreated` trigger", () => {
  const has = App.triggers[folderCreated.key] === folderCreated
  equal(has, true)
})

test("has the `folderDeleted` trigger", () => {
  const has = App.triggers[folderDeleted.key] === folderDeleted
  equal(has, true)
})

test("has the `roomArchived` trigger", () => {
  const has = App.triggers[roomArchived.key] === roomArchived
  equal(has, true)
})

test("has the `roomCreated` trigger", () => {
  const has = App.triggers[roomCreated.key] === roomCreated
  equal(has, true)
})

test("has the `shareRoles` trigger", () => {
  const has = App.triggers[shareRoles.key] === shareRoles
  equal(has, true)
})

test("has the `userAdded` trigger", () => {
  const has = App.triggers[userAdded.key] === userAdded
  equal(has, true)
})

test("has the `userInvited` trigger", () => {
  const has = App.triggers[userInvited.key] === userInvited
  equal(has, true)
})

// Searches

test("has the `searchFile` search", () => {
  const has = App.searches[searchFile.key] === searchFile
  equal(has, true)
})

test("has the `searchFolder` search", () => {
  const has = App.searches[searchFolder.key] === searchFolder
  equal(has, true)
})

// Actions

test("has the `archiveRoom` creation", () => {
  const has = App.creates[archiveRoom.key] === archiveRoom
  equal(has, true)
})

test("has the `createFile` creation", () => {
  const has = App.creates[createFile.key] === createFile
  equal(has, true)
})

test("has the `createFileInMyDocuments` creation", () => {
  const has = App.creates[createFileInMyDocuments.key] === createFileInMyDocuments
  equal(has, true)
})

test("has the `createFolder` creation", () => {
  const has = App.creates[createFolder.key] === createFolder
  equal(has, true)
})

test("has the `deleteFolder` creation", () => {
  const has = App.creates[deleteFolder.key] === deleteFolder
  equal(has, true)
})

test("has the `downloadFile` creation", () => {
  const has = App.creates[downloadFile.key] === downloadFile
  equal(has, true)
})

test("has the `externalLink` creation", () => {
  const has = App.creates[externalLink.key] === externalLink
  equal(has, true)
})

test("has the `inviteUser` creation", () => {
  const has = App.creates[inviteUser.key] === inviteUser
  equal(has, true)
})

test("has the `roomCreate` creation", () => {
  const has = App.creates[roomCreate.key] === roomCreate
  equal(has, true)
})

test("has the `shareRoom` creation", () => {
  const has = App.creates[shareRoom.key] === shareRoom
  equal(has, true)
})

test("has the `uploadFile` creation", () => {
  const has = App.creates[uploadFile.key] === uploadFile
  equal(has, true)
})

test.run()
