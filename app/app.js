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
const hydrators = require("./zapier/files/hydrators")
const { inviteUser } = require("./zapier/people/actions.js")
const {
  searchFile,
  searchFolder
} = require("./zapier/files/searches.js")
const { sessionAuth } = require("./zapier/auth/auth.js")
const { userAdded } = require("./zapier/people/triggers.js")

const App = {
  authentication: sessionAuth,
  beforeRequest: [
    ...beforeSessionAuthRequest
  ],
  creates: {
    [archiveRoom.key]: archiveRoom,
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [createFolder.key]: createFolder,
    [deleteFolder.key]: deleteFolder,
    [downloadFile.key]: downloadFile,
    [externalLink.key]: externalLink,
    [inviteUser.key]: inviteUser,
    [roomCreate.key]: roomCreate,
    [shareRoom.key]: shareRoom,
    [uploadFile.key]: uploadFile
  },
  hydrators,
  platformVersion,
  searches: {
    [searchFile.key]: searchFile,
    [searchFolder.key]: searchFolder
  },
  triggers: {
    [fileCreated.key]: fileCreated,
    [fileDeleted.key]: fileDeleted,
    [filesList.key]: filesList,
    [filteredSections.key]: filteredSections,
    [folderCreated.key]: folderCreated,
    [folderDeleted.key]: folderDeleted,
    [roomArchived.key]: roomArchived,
    [roomCreated.key]: roomCreated,
    [shareRoles.key]: shareRoles,
    [userAdded.key]: userAdded,
    [userInvited.key]: userInvited
  },
  version
}

module.exports = { App }
