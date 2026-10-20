//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { version: platformVersion } = require("zapier-platform-core")
const { version } = require("../package.json")
const {
  addRoomTags,
  archiveRoom,
  convertFile,
  copyFile,
  copyFolder,
  createFile,
  createFileInMyDocuments,
  createFileWithContent,
  createFolder,
  createFolderInMyDocuments,
  deleteFile,
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  fileExternalLink,
  getFile,
  getRoom,
  getRoomMembers,
  inviteGuest,
  listFolderContents,
  lockFile,
  moveFile,
  moveFolder,
  removeRoomTags,
  removeUserFromRoom,
  renameFile,
  renameFolder,
  roomCreate,
  shareRoom,
  unarchiveRoom,
  unlockFile,
  uploadFile,
  uploadFileToMyDocuments
} = require("./zapier/files/actions.js")
const { beforeSessionAuthRequest } = require("./docspace/auth/auth.js")
const {
  archivedRoomsList,
  destinationFoldersList,
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
  roomTagsList,
  roomUpdated,
  shareRoles,
  tagsList,
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
    [addRoomTags.key]: addRoomTags,
    [archiveRoom.key]: archiveRoom,
    [convertFile.key]: convertFile,
    [copyFile.key]: copyFile,
    [copyFolder.key]: copyFolder,
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments,
    [createFileWithContent.key]: createFileWithContent,
    [createFolder.key]: createFolder,
    [createFolderInMyDocuments.key]: createFolderInMyDocuments,
    [deleteFile.key]: deleteFile,
    [deleteFolder.key]: deleteFolder,
    [deleteFolderInMyDocuments.key]: deleteFolderInMyDocuments,
    [downloadFile.key]: downloadFile,
    [downloadFileFromMyDocuments.key]: downloadFileFromMyDocuments,
    [externalLink.key]: externalLink,
    [fileExternalLink.key]: fileExternalLink,
    [getFile.key]: getFile,
    [getRoom.key]: getRoom,
    [getRoomMembers.key]: getRoomMembers,
    [inviteGuest.key]: inviteGuest,
    [inviteUser.key]: inviteUser,
    [listFolderContents.key]: listFolderContents,
    [lockFile.key]: lockFile,
    [moveFile.key]: moveFile,
    [moveFolder.key]: moveFolder,
    [removeRoomTags.key]: removeRoomTags,
    [removeUserFromRoom.key]: removeUserFromRoom,
    [renameFile.key]: renameFile,
    [renameFolder.key]: renameFolder,
    [roomCreate.key]: roomCreate,
    [shareRoom.key]: shareRoom,
    [unarchiveRoom.key]: unarchiveRoom,
    [unlockFile.key]: unlockFile,
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
    [archivedRoomsList.key]: archivedRoomsList,
    [destinationFoldersList.key]: destinationFoldersList,
    [fileCreated.key]: fileCreated,
    [fileCreatedInMyDocuments.key]: fileCreatedInMyDocuments,
    [fileDeleted.key]: fileDeleted,
    [fileDeletedInMyDocuments.key]: fileDeletedInMyDocuments,
    [fileMoved.key]: fileMoved,
    [filesList.key]: filesList,
    [filesListFromMyDocuments.key]: filesListFromMyDocuments,
    [fileUpdated.key]: fileUpdated,
    [filteredSections.key]: filteredSections,
    [folderCreated.key]: folderCreated,
    [folderCreatedInMyDocuments.key]: folderCreatedInMyDocuments,
    [folderDeleted.key]: folderDeleted,
    [folderDeletedInMyDocuments.key]: folderDeletedInMyDocuments,
    [folderMoved.key]: folderMoved,
    [foldersInMyDocumentsList.key]: foldersInMyDocumentsList,
    [foldersList.key]: foldersList,
    [folderUpdated.key]: folderUpdated,
    [formFilledOut.key]: formFilledOut,
    [formSubmitted.key]: formSubmitted,
    [roomArchived.key]: roomArchived,
    [roomCreated.key]: roomCreated,
    [roomsFiltered.key]: roomsFiltered,
    [roomTagsList.key]: roomTagsList,
    [roomUpdated.key]: roomUpdated,
    [shareRoles.key]: shareRoles,
    [tagsList.key]: tagsList,
    [userAdded.key]: userAdded,
    [userInvited.key]: userInvited
  },
  version
}

module.exports = { App }
