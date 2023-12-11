//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { version: platformVersion } = require("zapier-platform-core")
const { beforeSessionAuthRequest, sessionAuth } = require("./auth.js")
const {
  createFile,
  createFileInMyDocuments,
  roomCreated,
  createFolder,
  archiveRoom,
  roomCreate,
  folderCreated,
  fileCreated,
  roomArchived
} = require("./files.js")
const { version } = require("../package.json")

const App = {
  version,
  platformVersion,
  authentication: sessionAuth,
  beforeRequest: [
    ...beforeSessionAuthRequest
  ],
  triggers: {
    [roomCreated.key]: roomCreated,
    [folderCreated.key]: folderCreated,
    [fileCreated.key]: fileCreated,
    [roomArchived.key]: roomArchived
  },
  creates: {
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [roomCreate.key]: roomCreate,
    [createFolder.key]: createFolder,
    [archiveRoom.key]: archiveRoom
  }
}

module.exports = { App }
