//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { join } = require("node:path")
const { readFile } = require("node:fs/promises")
const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { App } = require("./app.js")
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
  createRoomFromTemplate,
  deleteFile,
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  fileExternalLink,
  folderExternalLink,
  generateFormReport,
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
  roomTemplatesList,
  roomUpdated,
  shareRoles,
  tagsList,
  userInvited
} = require("./zapier/files/triggers.js")
const {
  changeUserType,
  disableUser,
  enableUser,
  inviteUser
} = require("./zapier/people/actions.js")
const {
  searchFile,
  searchFolder,
  searchRoom
} = require("./zapier/files/searches.js")
const pack = require("../package.json")
const { sessionAuth } = require("./zapier/auth/auth.js")
const { searchUser } = require("./zapier/people/searches.js")
const {
  disabledUsersList,
  userAdded
} = require("./zapier/people/triggers.js")

test("has the actual version", () => {
  const version = "1.1.2"
  equal(App.version, version)
  equal(pack.version, version)
})

test("has the actual platform version", async () => {
  const version = "19.2.0"
  const file = join(__dirname, "../.zapier-version")
  const content = await readFile(file, { encoding: "utf-8" })
  equal(App.platformVersion, version)
  equal(pack.dependencies["zapier-platform-core"], version)
  equal(content.trim(), version)
})

test("has session authentication", () => {
  const hasHandler = App.authentication === sessionAuth
  const hasHooks = beforeSessionAuthRequest.every((handler) => (
    App.beforeRequest.includes(handler)
  ))
  equal(hasHandler, true)
  equal(hasHooks, true)
})

// Triggers

test("has the `archivedRoomsList` trigger", () => {
  const has = App.triggers[archivedRoomsList.key] === archivedRoomsList
  equal(has, true)
})

test("has the `destinationFoldersList` trigger", () => {
  const has = App.triggers[destinationFoldersList.key] === destinationFoldersList
  equal(has, true)
})

test("has the `disabledUsersList` trigger", () => {
  const has = App.triggers[disabledUsersList.key] === disabledUsersList
  equal(has, true)
})

test("has the `fileCreated` trigger", () => {
  const has = App.triggers[fileCreated.key] === fileCreated
  equal(has, true)
})

test("has the `fileCreatedInMyDocuments` trigger", () => {
  const has = App.triggers[fileCreatedInMyDocuments.key] === fileCreatedInMyDocuments
  equal(has, true)
})

test("has the `fileDeleted` trigger", () => {
  const has = App.triggers[fileDeleted.key] === fileDeleted
  equal(has, true)
})

test("has the `fileDeletedInMyDocuments` trigger", () => {
  const has = App.triggers[fileDeletedInMyDocuments.key] === fileDeletedInMyDocuments
  equal(has, true)
})

test("has the `fileMoved` trigger", () => {
  const has = App.triggers[fileMoved.key] === fileMoved
  equal(has, true)
})

test("has the `filesList` trigger", () => {
  const has = App.triggers[filesList.key] === filesList
  equal(has, true)
})

test("has the `filesListFromMyDocuments` trigger", () => {
  const has = App.triggers[filesListFromMyDocuments.key] === filesListFromMyDocuments
  equal(has, true)
})

test("has the `fileUpdated` trigger", () => {
  const has = App.triggers[fileUpdated.key] === fileUpdated
  equal(has, true)
})

test("has the `filteredSections` trigger", () => {
  const has = App.triggers[filteredSections.key] === filteredSections
  equal(has, true)
})

test("has the `folderCreated` trigger", () => {
  const has = App.triggers[folderCreated.key] === folderCreated
  equal(has, true)
})

test("has the `folderCreatedInMyDocuments` trigger", () => {
  const has = App.triggers[folderCreatedInMyDocuments.key] === folderCreatedInMyDocuments
  equal(has, true)
})

test("has the `folderDeleted` trigger", () => {
  const has = App.triggers[folderDeleted.key] === folderDeleted
  equal(has, true)
})

test("has the `folderDeletedInMyDocuments` trigger", () => {
  const has = App.triggers[folderDeletedInMyDocuments.key] === folderDeletedInMyDocuments
  equal(has, true)
})

test("has the `folderMoved` trigger", () => {
  const has = App.triggers[folderMoved.key] === folderMoved
  equal(has, true)
})

test("has the `foldersInMyDocumentsList` trigger", () => {
  const has = App.triggers[foldersInMyDocumentsList.key] === foldersInMyDocumentsList
  equal(has, true)
})

test("has the `foldersList` trigger", () => {
  const has = App.triggers[foldersList.key] === foldersList
  equal(has, true)
})

test("has the `folderUpdated` trigger", () => {
  const has = App.triggers[folderUpdated.key] === folderUpdated
  equal(has, true)
})

test("has the `formFilledOut` trigger", () => {
  const has = App.triggers[formFilledOut.key] === formFilledOut
  equal(has, true)
})

test("has the `formSubmitted` trigger", () => {
  const has = App.triggers[formSubmitted.key] === formSubmitted
  equal(has, true)
})

test("has the `roomArchived` trigger", () => {
  const has = App.triggers[roomArchived.key] === roomArchived
  equal(has, true)
})

test("has the `roomCreated` trigger", () => {
  const has = App.triggers[roomCreated.key] === roomCreated
  equal(has, true)
})

test("has the `roomsFiltered` trigger", () => {
  const has = App.triggers[roomsFiltered.key] === roomsFiltered
  equal(has, true)
})

test("has the `roomTagsList` trigger", () => {
  const has = App.triggers[roomTagsList.key] === roomTagsList
  equal(has, true)
})

test("has the `roomTemplatesList` trigger", () => {
  const has = App.triggers[roomTemplatesList.key] === roomTemplatesList
  equal(has, true)
})

test("has the `roomUpdated` trigger", () => {
  const has = App.triggers[roomUpdated.key] === roomUpdated
  equal(has, true)
})

test("has the `shareRoles` trigger", () => {
  const has = App.triggers[shareRoles.key] === shareRoles
  equal(has, true)
})

test("has the `tagsList` trigger", () => {
  const has = App.triggers[tagsList.key] === tagsList
  equal(has, true)
})

test("has the `userAdded` trigger", () => {
  const has = App.triggers[userAdded.key] === userAdded
  equal(has, true)
})

test("has the `userInvited` trigger", () => {
  const has = App.triggers[userInvited.key] === userInvited
  equal(has, true)
})

// Searches

test("has the `searchFile` search", () => {
  const has = App.searches[searchFile.key] === searchFile
  equal(has, true)
})

test("has the `searchFolder` search", () => {
  const has = App.searches[searchFolder.key] === searchFolder
  equal(has, true)
})

test("has the `searchRoom` search", () => {
  const has = App.searches[searchRoom.key] === searchRoom
  equal(has, true)
})

test("has the `searchUser` search", () => {
  const has = App.searches[searchUser.key] === searchUser
  equal(has, true)
})

// Actions

test("has the `addRoomTags` creation", () => {
  const has = App.creates[addRoomTags.key] === addRoomTags
  equal(has, true)
})

test("has the `archiveRoom` creation", () => {
  const has = App.creates[archiveRoom.key] === archiveRoom
  equal(has, true)
})

test("has the `changeUserType` creation", () => {
  const has = App.creates[changeUserType.key] === changeUserType
  equal(has, true)
})

test("has the `convertFile` creation", () => {
  const has = App.creates[convertFile.key] === convertFile
  equal(has, true)
})

test("has the `copyFile` creation", () => {
  const has = App.creates[copyFile.key] === copyFile
  equal(has, true)
})

test("has the `copyFolder` creation", () => {
  const has = App.creates[copyFolder.key] === copyFolder
  equal(has, true)
})

test("has the `createFile` creation", () => {
  const has = App.creates[createFile.key] === createFile
  equal(has, true)
})

test("has the `createFileInMyDocuments` creation", () => {
  const has = App.creates[createFileInMyDocuments.key] === createFileInMyDocuments
  equal(has, true)
})

test("has the `createFileWithContent` creation", () => {
  const has = App.creates[createFileWithContent.key] === createFileWithContent
  equal(has, true)
})

test("has the `createFolder` creation", () => {
  const has = App.creates[createFolder.key] === createFolder
  equal(has, true)
})

test("has the `createFolderInMyDocuments` creation", () => {
  const has = App.creates[createFolderInMyDocuments.key] === createFolderInMyDocuments
  equal(has, true)
})

test("has the `createRoomFromTemplate` creation", () => {
  const has = App.creates[createRoomFromTemplate.key] === createRoomFromTemplate
  equal(has, true)
})

test("has the `deleteFile` creation", () => {
  const has = App.creates[deleteFile.key] === deleteFile
  equal(has, true)
})

test("has the `deleteFolder` creation", () => {
  const has = App.creates[deleteFolder.key] === deleteFolder
  equal(has, true)
})

test("has the `deleteFolderInMyDocuments` creation", () => {
  const has = App.creates[deleteFolderInMyDocuments.key] === deleteFolderInMyDocuments
  equal(has, true)
})

test("has the `disableUser` creation", () => {
  const has = App.creates[disableUser.key] === disableUser
  equal(has, true)
})

test("has the `downloadFile` creation", () => {
  const has = App.creates[downloadFile.key] === downloadFile
  equal(has, true)
})

test("has the `downloadFileFromMyDocuments` creation", () => {
  const has = App.creates[downloadFileFromMyDocuments.key] === downloadFileFromMyDocuments
  equal(has, true)
})

test("has the `enableUser` creation", () => {
  const has = App.creates[enableUser.key] === enableUser
  equal(has, true)
})

test("has the `externalLink` creation", () => {
  const has = App.creates[externalLink.key] === externalLink
  equal(has, true)
})

test("has the `fileExternalLink` creation", () => {
  const has = App.creates[fileExternalLink.key] === fileExternalLink
  equal(has, true)
})

test("has the `folderExternalLink` creation", () => {
  const has = App.creates[folderExternalLink.key] === folderExternalLink
  equal(has, true)
})

test("has the `generateFormReport` creation", () => {
  const has = App.creates[generateFormReport.key] === generateFormReport
  equal(has, true)
})

test("has the `getFile` creation", () => {
  const has = App.creates[getFile.key] === getFile
  equal(has, true)
})

test("has the `getRoom` creation", () => {
  const has = App.creates[getRoom.key] === getRoom
  equal(has, true)
})

test("has the `getRoomMembers` creation", () => {
  const has = App.creates[getRoomMembers.key] === getRoomMembers
  equal(has, true)
})

test("has the `inviteGuest` creation", () => {
  const has = App.creates[inviteGuest.key] === inviteGuest
  equal(has, true)
})

test("has the `inviteUser` creation", () => {
  const has = App.creates[inviteUser.key] === inviteUser
  equal(has, true)
})

test("has the `listFolderContents` creation", () => {
  const has = App.creates[listFolderContents.key] === listFolderContents
  equal(has, true)
})

test("has the `lockFile` creation", () => {
  const has = App.creates[lockFile.key] === lockFile
  equal(has, true)
})

test("has the `moveFile` creation", () => {
  const has = App.creates[moveFile.key] === moveFile
  equal(has, true)
})

test("has the `moveFolder` creation", () => {
  const has = App.creates[moveFolder.key] === moveFolder
  equal(has, true)
})

test("has the `removeRoomTags` creation", () => {
  const has = App.creates[removeRoomTags.key] === removeRoomTags
  equal(has, true)
})

test("has the `removeUserFromRoom` creation", () => {
  const has = App.creates[removeUserFromRoom.key] === removeUserFromRoom
  equal(has, true)
})

test("has the `renameFile` creation", () => {
  const has = App.creates[renameFile.key] === renameFile
  equal(has, true)
})

test("has the `renameFolder` creation", () => {
  const has = App.creates[renameFolder.key] === renameFolder
  equal(has, true)
})

test("has the `roomCreate` creation", () => {
  const has = App.creates[roomCreate.key] === roomCreate
  equal(has, true)
})

test("has the `shareRoom` creation", () => {
  const has = App.creates[shareRoom.key] === shareRoom
  equal(has, true)
})

test("has the `unarchiveRoom` creation", () => {
  const has = App.creates[unarchiveRoom.key] === unarchiveRoom
  equal(has, true)
})

test("has the `unlockFile` creation", () => {
  const has = App.creates[unlockFile.key] === unlockFile
  equal(has, true)
})

test("has the `uploadFile` creation", () => {
  const has = App.creates[uploadFile.key] === uploadFile
  equal(has, true)
})

test("has the `uploadFileToMyDocuments` creation", () => {
  const has = App.creates[uploadFileToMyDocuments.key] === uploadFileToMyDocuments
  equal(has, true)
})

/**
 * @param {Record<string, any>} items
 * @param {RegExp} description
 */
function checkTexts(items, description) {
  for (const item of Object.values(items)) {
    const { key, noun } = item
    const { label } = item.display
    const titleCase = /^[A-Z][a-z]*( ([A-Z][a-z]*|and|from|in|of|to|with))*$/
    equal(titleCase.test(label), true, `${key}: the label is in title case`)
    equal(/^[A-Z][a-z]+$/.test(noun), true, `${key}: the noun is one singular word`)
    if (!item.display.hidden) {
      equal(description.test(item.display.description), true, `${key}: the description`)
    }
    for (const field of item.operation.inputFields || []) {
      if (typeof field === "object") {
        equal(/ id$/i.test(field.label), false, `${key}.${field.key}: the label has no "id"`)
        equal(/^[A-Z][^A-Z]*$/.test(field.label), true, `${key}.${field.key}: the label is in sentence case`)
      }
    }
  }
}

test("uses dropdowns of the Files section in its triggers and actions", () => {
  /** @type {Record<string, any>} */
  const items = { ...App.triggers, ...App.creates }
  for (const item of Object.values(items)) {
    if (!/MyDocuments/.test(item.key) || item.display.hidden) {
      continue
    }
    for (const field of item.operation.inputFields || []) {
      if (typeof field === "object" && field.dynamic) {
        equal(/MyDocuments/.test(field.dynamic), true, `${item.key}.${field.key}: ${field.dynamic}`)
      }
    }
  }
})

test("follows the Zapier style of triggers", () => {
  checkTexts(App.triggers, /^Triggers when .+\.$/)
})

test("follows the Zapier style of actions", () => {
  checkTexts(App.creates, /^[A-Z][a-z]+s .+\.$/)
})

test("follows the Zapier style of searches", () => {
  checkTexts(App.searches, /^Finds .+\.$/)
  for (const search of Object.values(App.searches)) {
    equal(search.display.label.startsWith("Find "), true, `${search.key}: the label starts with "Find"`)
  }
})

test.run()
