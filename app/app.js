//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { version: platformVersion } = require("zapier-platform-core")
const { version } = require("../package.json")
const {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  externalLink,
  roomCreate
} = require("./zapier/files/actions.js")
const { beforeSessionAuthRequest } = require("./docspase/auth/auth.js")
const {
  fileCreated,
  fileDeleted,
  filteredSections,
  folderCreated,
  folderDeleted,
  roomArchived,
  roomCreated,
  userInvited
} = require("./zapier/files/triggers.js")
const { inviteUser } = require("./zapier/people/actions.js")
const {
  searchFile,
  searchFolder
} = require("./zapier/files/searches.js")
const { sessionAuth } = require("./zapier/auth/auth.js")
const { userAdded } = require("./zapier/people/triggers.js")

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
    [filteredSections.key]: filteredSections,
    [folderCreated.key]: folderCreated,
    [folderDeleted.key]: folderDeleted,
    [roomArchived.key]: roomArchived,
    [roomCreated.key]: roomCreated,
    [userAdded.key]: userAdded,
    [userInvited.key]: userInvited
  },
  searches: {
    [searchFile.key]: searchFile,
    [searchFolder.key]: searchFolder
  },
  creates: {
    [archiveRoom.key]: archiveRoom,
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [createFolder.key]: createFolder,
    [externalLink.key]: externalLink,
    [inviteUser.key]: inviteUser,
    [roomCreate.key]: roomCreate
  }
}

module.exports = { App }
