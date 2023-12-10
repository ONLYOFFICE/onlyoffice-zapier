//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { version: platformVersion } = require("zapier-platform-core")
const { beforeSessionAuthRequest, sessionAuth } = require("./auth.js")
const { createFile, createFileInMyDocuments, roomCreated, createFolder, archiveRoom } = require("./files.js")
const { userAdded } = require("./people.js")
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
    [userAdded.key]: userAdded
  },
  creates: {
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [createFolder.key]: createFolder,
    [archiveRoom.key]: archiveRoom
  }
}

module.exports = { App }
