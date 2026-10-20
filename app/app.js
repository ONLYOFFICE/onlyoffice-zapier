//
// (c) Copyright Ascensio System SIA 2026
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
  deleteFile,
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  getFile,
  getRoom,
  inviteGuest,
  renameFile,
  renameFolder,
  roomCreate,
  shareRoom,
  uploadFile,
  uploadFileToMyDocuments
} = require("./zapier/files/actions.js")
const { beforeSessionAuthRequest } = require("./docspace/auth/auth.js")
const {
  fileCreated,
  fileCreatedInMyDocuments,
  fileDeleted,
  fileDeletedInMyDocuments,
  fileMoved,
  filesList,
  filesListFromMyDocuments,
  fileUpdated,
  filteredSections,
  folderCreated,
  folderCreatedInMyDocuments,
  folderDeleted,
  folderDeletedInMyDocuments,
  folderMoved,
  foldersInMyDocumentsList,
  foldersList,
  folderUpdated,
  formFilledOut,
  formSubmitted,
  roomArchived,
  roomCreated,
  roomsFiltered,
  roomUpdated,
  shareRoles,
  userInvited
} = require("./zapier/files/triggers.js")
const hydrators = require("./zapier/files/hydrators")
const { inviteUser } = require("./zapier/people/actions.js")
const {
  searchFile,
  searchFolder,
  searchRoom
} = require("./zapier/files/searches.js")
const { sessionAuth } = require("./zapier/auth/auth.js")
const { searchUser } = require("./zapier/people/searches.js")
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
    [deleteFile.key]: deleteFile,
    [deleteFolder.key]: deleteFolder,
    [deleteFolderInMyDocuments.key]: deleteFolderInMyDocuments,
    [downloadFile.key]: downloadFile,
    [downloadFileFromMyDocuments.key]: downloadFileFromMyDocuments,
    [externalLink.key]: externalLink,
    [getFile.key]: getFile,
    [getRoom.key]: getRoom,
    [inviteGuest.key]: inviteGuest,
    [inviteUser.key]: inviteUser,
    [renameFile.key]: renameFile,
    [renameFolder.key]: renameFolder,
    [roomCreate.key]: roomCreate,
    [shareRoom.key]: shareRoom,
    [uploadFile.key]: uploadFile,
    [uploadFileToMyDocuments.key]: uploadFileToMyDocuments
  },
  flags: {
    cleanInputData: false
  },
  hydrators,
  platformVersion,
  searches: {
    [searchFile.key]: searchFile,
    [searchFolder.key]: searchFolder,
    [searchRoom.key]: searchRoom,
    [searchUser.key]: searchUser
  },
  triggers: {
    [fileCreated.key]: fileCreated,
    [fileCreatedInMyDocuments.key]: fileCreatedInMyDocuments,
    [fileDeleted.key]: fileDeleted,
    [fileDeletedInMyDocuments.key]: fileDeletedInMyDocuments,
    [fileMoved.key]: fileMoved,
    [fileUpdated.key]: fileUpdated,
    [filesList.key]: filesList,
    [filesListFromMyDocuments.key]: filesListFromMyDocuments,
    [filteredSections.key]: filteredSections,
    [folderCreated.key]: folderCreated,
    [folderCreatedInMyDocuments.key]: folderCreatedInMyDocuments,
    [folderDeleted.key]: folderDeleted,
    [folderDeletedInMyDocuments.key]: folderDeletedInMyDocuments,
    [foldersInMyDocumentsList.key]: foldersInMyDocumentsList,
    [foldersList.key]: foldersList,
    [folderMoved.key]: folderMoved,
    [folderUpdated.key]: folderUpdated,
    [formFilledOut.key]: formFilledOut,
    [formSubmitted.key]: formSubmitted,
    [roomArchived.key]: roomArchived,
    [roomCreated.key]: roomCreated,
    [roomsFiltered.key]: roomsFiltered,
    [roomUpdated.key]: roomUpdated,
    [shareRoles.key]: shareRoles,
    [userAdded.key]: userAdded,
    [userInvited.key]: userInvited
  },
  version
}

module.exports = { App }
