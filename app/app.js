//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { version: platformVersion } = require("zapier-platform-core")
const { beforeSessionAuthRequest, sessionAuth } = require("./auth.js")
const {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  externalLink,
  fileCreated,
  fileDeleted,
  folderCreated,
  roomArchived,
  roomCreate,
  roomCreated
} = require("./files.js")
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
    [fileCreated.key]: fileCreated,
    [fileDeleted.key]: fileDeleted,
    [folderCreated.key]: folderCreated,
    [roomArchived.key]: roomArchived,
    [roomCreated.key]: roomCreated,
    [userAdded.key]: userAdded
  },
  creates: {
    [archiveRoom.key]: archiveRoom,
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [createFolder.key]: createFolder,
    [externalLink.key]: externalLink,
    [roomCreate.key]: roomCreate
  }
}

module.exports = { App }
