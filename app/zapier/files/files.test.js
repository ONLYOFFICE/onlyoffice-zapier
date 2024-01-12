//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, match, not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
const {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  downloadFile,
  externalLink,
  roomCreate,
  shareRoom,
  uploadFile
} = require("./actions.js")
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
} = require("./triggers.js")
const { invitedUser } = require("../people/people.fixture.js")
const {
  searchFile,
  searchFolder
} = require("./searches.js")
const { sessionAuthContext, sessionAuthPerform } = require("../auth/auth.fixture.js")

/**
 * @typedef {import("./actions.js").ArchiveRoomFields} ArchiveRoomFields
 * @typedef {import("./actions.js").CreateFileFields} CreateFileFields
 * @typedef {import("./actions.js").CreateFileInMyDocumentsFields} CreateFileInMyDocumentsFields
 * @typedef {import("./actions.js").CreateFolderFields} CreateFolderFields
 * @typedef {import("./actions.js").DownloadFileFields} DownloadFileFields
 * @typedef {import("./actions.js").ExternalLinkFields} ExternalLinkFields
 * @typedef {import("./triggers.js").FileCreatedFields} FileCreatedFields
 * @typedef {import("./triggers.js").FilesListFields} FilesListFields
 * @typedef {import("./triggers.js").FolderCreatedFields} FolderCreatedFields
 * @typedef {import("./actions.js").RoomCreateFields} RoomCreateFields
 * @typedef {import("./searches.js").SearchFields} SearchFields
 * @typedef {import("./triggers.js").ShareRolesFields} ShareRolesFields
 * @typedef {import("./actions.js").UploadFileFields} UploadFileFields
 * @typedef {import("./triggers.js").UserInvitedFields} UserInvitedFields
 */

const tester = createAppTester(App)

const Files = suite("files", {
  ...sessionAuthContext(),
  inputData: {
    access: 0,
    archiveId: 0,
    fileId: 0,
    folderId: 0,
    id: 0,
    myDocumentsId: 0,
    roomsId: 0,
    trashId: 0
  }
})

Files.before(async (context) => {
  await sessionAuthPerform(tester, context)
})

Files("create a room", async (context) => {
  const { perform } = roomCreate.operation
  /** @type {RoomCreateFields} */
  const inputData = {
    title: "Test room",
    type: "CustomRoom"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const room = await tester(perform, bundle)
  if (!room) {
    unreachable("TODO")
    return
  }
  equal(bundle.inputData.title, room.title)
})

Files("triggers when a room is created", async (context) => {
  const { perform } = roomCreated.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const room = folders[0]
  if (!room) {
    unreachable("TODO")
    return
  }
  context.inputData.id = room.id
  not.equal(room.id, 0)
})

Files("hidden filtered sections trigger return sections", async (context) => {
  const { perform } = filteredSections.operation
  const bundle = {
    authData: context.authData
  }
  const sections = await tester(perform, bundle)
  const section = sections[0]
  if (!section) {
    unreachable("TODO")
    return
  }
  sections.forEach(item => {
    switch (item.title) {
    case "My documents":
      context.inputData.myDocumentsId = item.id
      break
    case "Trash":
      context.inputData.trashId = item.id
      break
    case "Rooms":
      context.inputData.roomsId = item.id
      break
    case "Archive":
      context.inputData.archiveId = item.id
      break
    default:
      break
    }
  })
  not.equal(section.id, 0)
})

Files("creates a file", async (context) => {
  const { perform } = createFile.operation
  /** @type {CreateFileFields} */
  const inputData = {
    folderId: context.inputData.id,
    title: "README"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.folderId, bundle.inputData.folderId)
})

Files("hidden files list trigger returned file via room id", async (context) => {
  const { perform } = filesList.operation
  /** @type {FilesListFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  equal(file.title, "README.docx")
})

Files("hidden files list trigger returned file via folder id", async (context) => {
  const { perform } = filesList.operation
  /** @type {FilesListFields} */
  const inputData = {
    id: -1, // In Zapier UI, the user will be required to first select a Room
    folderId: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  equal(file.title, "README.docx")
})

Files("search a file", async (context) => {
  const { perform } = searchFile.operation
  /** @type {SearchFields} */
  const inputData = {
    folderId: context.inputData.myDocumentsId,
    title: "README"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  if (!file) {
    unreachable("TODO")
    return
  }
  not.equal(file.id, 0)
})

Files("creates a file in the My Documents", async (context) => {
  const { perform } = createFileInMyDocuments.operation
  /** @type {CreateFileInMyDocumentsFields} */
  const inputData = {
    title: "README"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  context.inputData.fileId = result.id
  not.equal(result.id, 0)
})

Files("downloads file", async (context) => {
  const { perform } = downloadFile.operation
  /** @type {DownloadFileFields} */
  const inputData = {
    fileId: context.inputData.fileId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  match(result.file, "hydrate|||")
})

Files("create a folder", async (context) => {
  const { perform } = createFolder.operation
  /** @type {CreateFolderFields} */
  const inputData = {
    folderId: context.inputData.id,
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  context.inputData.folderId = result.id
  not.equal(result.id, 0)
})

Files("search a folder", async (context) => {
  const { perform } = searchFolder.operation
  /** @type {SearchFields} */
  const inputData = {
    folderId: context.inputData.roomsId,
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  if (!folder) {
    unreachable("TODO")
    return
  }
  not.equal(folder.id, 0)
})

Files("upload a file", async (context) => {
  const { perform } = uploadFile.operation
  /** @type {UploadFileFields} */
  const inputData = {
    folderId: context.inputData.id,
    url: "https://d2nlctn12v279m.cloudfront.net/assets/docs/samples/demo.docx"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.uploaded, true)
})


Files("returns the links of a room", async (context) => {
  const { perform } = externalLink.operation
  /** @type {ExternalLinkFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  not.equal(result.sharedTo.shareLink, null)
})

Files("triggers when a folder is created", async (context) => {
  const { perform } = folderCreated.operation
  /** @type {FolderCreatedFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  if (!folder) {
    unreachable("TODO")
    return
  }
  not.equal(folder.id, 0)
})

Files("triggers when a file is created", async (context) => {
  const { perform } = fileCreated.operation
  /** @type {FileCreatedFields} */
  const inputData = {
    folderId: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const file = await tester(perform, bundle)
  const newFile = file[0]
  if (!newFile) {
    unreachable("TODO")
    return
  }

  not.equal(newFile.id, 0)
})

Files("triggers when a file is deleted", async (context) => {
  const { perform } = fileDeleted.operation
  const bundle = {
    authData: context.authData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  // TODO: Without the file delete action, the file delete trigger test may fail because the trash may be empty.
  if (files.length) not.equal(file.id, 0)
  else equal(true, true)
})

Files("triggers when a user invited to Room", async (context) => {
  // TODO: After merging with the invite-user-action branch,
  // add a test with an array length check.
  // If active true, an array of length 1 will be returned
  // if active false, array will consist of two elements.
  const { perform } = userInvited.operation
  /** @type {UserInvitedFields} */
  const inputData = {
    id: context.inputData.id,
    active: true
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const users = await tester(perform, bundle)
  const user = users[0]
  not.equal(user.id, 0)
})

Files("hidden share roles trigger return roles", async (context) => {
  const { perform } = shareRoles.operation
  /** @type {ShareRolesFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const roles = await tester(perform, bundle)
  const role = roles[0]
  if (!role) {
    unreachable("TODO")
    return
  }
  context.inputData.access = role.id
  not.equal(role.id, 0)
})

Files("user is invited to the room", async (context) => {
  const { perform } = shareRoom.operation
  const userId = await invitedUser(context.authData)
  const inputData = {
    roomId: context.inputData.id,
    userId: userId,
    access: context.inputData.access
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const members = await tester(perform, bundle)
  equal(members.id, userId)
})

Files("archive the room", async (context) => {
  const { perform } = archiveRoom.operation
  /** @type {ArchiveRoomFields} */
  const inputData = {
    id: context.inputData.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.finished, true)
})

Files("triggers when a room is archived", async (context) => {
  const { perform } = roomArchived.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const room = folders[0]
  if (!room) {
    unreachable("TODO")
    return
  }
  not.equal(room.id, 0)
})

Files("triggers when a folder is deleted", async (context) => {
  const { perform } = folderDeleted.operation
  // TODO: Add a check to delete a folder from a specific room after adding a Delete Folder action
  /*const inputData = {
    id: context.inputData.folderId
  }*/
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  // TODO: Without the folder delete action, the folder delete trigger test may fail because the trash may be empty.
  if (folders.length) not.equal(folder.id, 0)
  else equal(true, true)
})

Files.run()
