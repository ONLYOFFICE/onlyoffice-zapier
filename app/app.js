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
    [roomArchived.key]: roomArchived
  },
  creates: {
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [createFolder.key]: createFolder,
    [archiveRoom.key]: archiveRoom
  }
}

module.exports = { App }
