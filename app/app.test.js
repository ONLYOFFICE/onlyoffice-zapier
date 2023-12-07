//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { readFile } = require("node:fs/promises")
const { join } = require("node:path")
const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { App } = require("./app.js")
const { beforeSessionAuthRequest, sessionAuth } = require("./auth.js")
const {
  createFile,
  createFileInMyDocuments,
  roomCreated,
  createFolder,
  archiveRoom,
  roomArchived
} = require("./files.js")
const pack = require("../package.json")

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
  const hasHandler = App.authentication == sessionAuth
  const hasHooks = beforeSessionAuthRequest.every((handler) => (
    App.beforeRequest.includes(handler)
  ))
  equal(hasHandler, true)
  equal(hasHooks, true)
})

test("has the `roomCreated` trigger", () => {
  const has = App.triggers[roomCreated.key] == roomCreated
  equal(has, true)
})

test("has the `createFile` creation", () => {
  const has = App.creates[createFile.key] == createFile
  equal(has, true)
})

test("has the `createFileInMyDocuments` creation", () => {
  const has = App.creates[createFileInMyDocuments.key] == createFileInMyDocuments
  equal(has, true)
})

test("has the `createFolder` creation", () => {
  const has = App.creates[createFolder.key] == createFolder
  equal(has, true)
})

test("has the `archiveRoom` creation", () => {
  const has = App.creates[archiveRoom.key] == archiveRoom
  equal(has, true)
})

test("has the `roomArchived` trigger", () => {
  const has = App.triggers[roomArchived.key] === roomArchived
  equal(has, true)
})

test.run()
