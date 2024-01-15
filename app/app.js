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
  createFolderInMyDocuments,
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  roomCreate,
  shareRoom,
  uploadFile,
  uploadFileToMyDocuments
} = require("./zapier/files/actions.js")
const { beforeSessionAuthRequest } = require("./docspase/auth/auth.js")
const {
  fileCreated,
  fileCreatedInMyDocuments,
  fileDeleted,
  fileDeletedInMyDocuments,
  filesList,
  filesListFromMyDocuments,
  filteredSections,
  folderCreated,
  folderCreatedInMyDocuments,
  folderDeleted,
  folderDeletedInMyDocuments,
  foldersInMyDocumentsList,
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
    [createFolderInMyDocuments.key]: createFolderInMyDocuments,
    [deleteFolder.key]: deleteFolder,
    [deleteFolderInMyDocuments.key]: deleteFolderInMyDocuments,
    [downloadFile.key]: downloadFile,
    [downloadFileFromMyDocuments.key]: downloadFileFromMyDocuments,
    [externalLink.key]: externalLink,
    [inviteUser.key]: inviteUser,
    [roomCreate.key]: roomCreate,
    [shareRoom.key]: shareRoom,
    [uploadFile.key]: uploadFile,
    [uploadFileToMyDocuments.key]: uploadFileToMyDocuments
  },
  hydrators,
  platformVersion,
  searches: {
    [searchFile.key]: searchFile,
    [searchFolder.key]: searchFolder
  },
  triggers: {
    [fileCreated.key]: fileCreated,
    [fileCreatedInMyDocuments.key]: fileCreatedInMyDocuments,
    [fileDeleted.key]: fileDeleted,
    [fileDeletedInMyDocuments.key]: fileDeletedInMyDocuments,
    [filesList.key]: filesList,
    [filesListFromMyDocuments.key]: filesListFromMyDocuments,
    [filteredSections.key]: filteredSections,
    [folderCreated.key]: folderCreated,
    [folderCreatedInMyDocuments.key]: folderCreatedInMyDocuments,
    [folderDeleted.key]: folderDeleted,
    [folderDeletedInMyDocuments.key]: folderDeletedInMyDocuments,
    [foldersInMyDocumentsList.key]: foldersInMyDocumentsList,
    [roomArchived.key]: roomArchived,
    [roomCreated.key]: roomCreated,
    [shareRoles.key]: shareRoles,
    [userAdded.key]: userAdded,
    [userInvited.key]: userInvited
  },
  version
}

module.exports = { App }
