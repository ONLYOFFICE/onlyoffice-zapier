//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, match, not } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
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
} = require("./actions.js")
const {
  fileCreated,
  fileCreatedInMyDocuments,
  //fileDeleted,
  //fileDeletedInMyDocuments, TODO:
  fileMoved,
  filesList,
  //filesListFromMyDocuments, TODO:
  fileUpdated,
  filteredSections,
  folderCreated,
  folderCreatedInMyDocuments,
  folderDeleted,
  folderDeletedInMyDocuments,
  folderMoved,
  //foldersInMyDocumentsList, TODO:
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
} = require("./triggers.js")
const { invitedUser } = require("../people/people.fixture.js")
const {
  searchFile,
  searchFolder,
  searchRoom
} = require("./searches.js")
const { sessionAuthContext, sessionAuthPerform } = require("../auth/auth.fixture.js")
const { CONTENT_CREATOR } = require("../../docspace/client/client.js")

/**
 * @typedef {import("./actions.js").ArchiveRoomFields} ArchiveRoomFields
 * @typedef {import("./actions.js").CreateFileFields} CreateFileFields
 * @typedef {import("./actions.js").CreateFileInMyDocumentsFields} CreateFileInMyDocumentsFields
 * @typedef {import("./actions.js").CreateFolderFields} CreateFolderFields
 * @typedef {import("./actions.js").CreateFolderInMyDocumentsFields} CreateFolderInMyDocumentsFields
 * @typedef {import("./actions.js").DeleteFolderFields} DeleteFolderFields
 * @typedef {import("./actions.js").DeleteFolderInMyDocumentsFields} DeleteFolderInMyDocumentsFields
 * @typedef {import("./actions.js").DownloadFileFields} DownloadFileFields
 * @typedef {import("./actions.js").DownloadFileFromMyDocumentsFields} DownloadFileFromMyDocumentsFields
 * @typedef {import("./actions.js").ExternalLinkFields} ExternalLinkFields
 * @typedef {import("./triggers.js").FileCreatedFields} FileCreatedFields
 * @typedef {import("./triggers.js").FileCreatedInMyDocumentsFields} FileCreatedInMyDocumentsFields
 * @typedef {import("./triggers.js").FilesListFields} FilesListFields
 * @typedef {import("./triggers.js").FolderCreatedFields} FolderCreatedFields
 * @typedef {import("./actions.js").InviteGuestFields} InviteGuestFields
 * @typedef {import("./actions.js").RoomCreateFields} RoomCreateFields
 * @typedef {import("./searches.js").SearchFields} SearchFields
 * @typedef {import("./triggers.js").ShareRolesFields} ShareRolesFields
 * @typedef {import("./actions.js").UploadFileFields} UploadFileFields
 * @typedef {import("./actions.js").UploadFileToMyDocumentsFields} UploadFileToMyDocumentsFields
 * @typedef {import("./triggers.js").UserInvitedFields} UserInvitedFields
 */

const tester = createAppTester(App)

const Files = suite("files", {
  ...sessionAuthContext(),
  inputData: {
    access: 0,
    hydrate: "",
    myDocuments: {
      fileId: 0,
      folderId: {
        fileId: 0,
        id: 0
      }
    },
    rooms: {
      fileId: 0,
      folderId: 0,
      roomId: 0
    },
    sections: {
      archive: 0,
      documents: 0,
      rooms: 0,
      trash: 0
    },
    user: ""
  }
})

Files.before(async (context) => {
  await sessionAuthPerform(tester, context)
})

Files("hidden filtered sections trigger return sections", async (context) => {
  const { perform } = filteredSections.operation
  const bundle = {
    authData: context.authData
  }
  const sections = await tester(perform, bundle)
  sections.forEach((item) => {
    switch (item.title) {
    case "Files":
      context.inputData.sections.documents = item.id
      break
    case "Trash":
      context.inputData.sections.trash = item.id
      break
    case "Rooms":
      context.inputData.sections.rooms = item.id
      break
    case "Archive":
      context.inputData.sections.archive = item.id
      break
    default:
      break
    }
  })
  not.equal(context.inputData.sections.documents, 0)
  not.equal(context.inputData.sections.trash, 0)
  not.equal(context.inputData.sections.rooms, 0)
  not.equal(context.inputData.sections.archive, 0)
})

Files("create a room", async (context) => {
  const { perform } = roomCreate.operation
  /** @type {RoomCreateFields} */
  const inputData = {
    roomType: "5",
    title: "Test room"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const room = await tester(perform, bundle)
  context.inputData.rooms.roomId = room.id
  equal(bundle.inputData.title, room.title)
})

Files("triggers when a room is created", async (context) => {
  const { perform } = roomCreated.operation
  const bundle = {
    authData: context.authData
  }
  const rooms = await tester(perform, bundle)
  const room = rooms[0]
  equal(room.id, context.inputData.rooms.roomId)
})

Files("lists the updated room", async (context) => {
  const { performList } = roomUpdated.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      roomId: context.inputData.rooms.roomId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const rooms = await tester(performList, bundle)
  equal(rooms[0].id, context.inputData.rooms.roomId)
})

Files("lists no filled out forms in a room without forms", async (context) => {
  const { performList } = formFilledOut.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  equal(await tester(performList, bundle), [])
})

Files("lists no submitted forms in a room without forms", async (context) => {
  const { performList } = formSubmitted.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  equal(await tester(performList, bundle), [])
})

Files("hidden rooms filtered trigger returns rooms with external links", async (context) => {
  const { perform } = roomsFiltered.operation
  const bundle = {
    authData: context.authData
  }
  const rooms = await tester(perform, bundle)
  const room = rooms.find((item) => item.id === context.inputData.rooms.roomId)
  not.equal(room, undefined)
  const withoutLinks = [
    2,
    8,
    9
  ]
  equal(rooms.some((item) => withoutLinks.includes(Number(item.roomType))), false)
})

Files("hidden share roles trigger return roles", async (context) => {
  const { perform } = shareRoles.operation
  /** @type {ShareRolesFields} */
  const inputData = {
    roomId: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const roles = await tester(perform, bundle)
  const role = roles[0]
  context.inputData.access = role.id
  not.equal(role.id, 0)
})

Files("user is invited to the room", async (context) => {
  const { perform } = shareRoom.operation
  context.inputData.user = await invitedUser(context.authData)
  const inputData = {
    access: context.inputData.access,
    roomId: context.inputData.rooms.roomId,
    userId: context.inputData.user
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const members = await tester(perform, bundle)
  equal(members.id, context.inputData.user)
})

Files("triggers when a user invited to room", async (context) => {
  const { perform } = userInvited.operation
  /** @type {UserInvitedFields} */
  const inputData = {
    active: false, // invited user is not active
    id: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const users = await tester(perform, bundle)
  const user = users[1] // first user - me
  equal(user.id, context.inputData.user)
})

Files("returns the links of a room", async (context) => {
  const { perform } = externalLink.operation
  /** @type {ExternalLinkFields} */
  const inputData = {
    id: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const link = await tester(perform, bundle)
  not.equal(link.sharedTo.shareLink, null)
})

Files("invited a guest", async (context) => {
  // TODO: add hidden action for remove guest
  const { perform } = inviteGuest.operation
  /** @type {InviteGuestFields} */
  const inputData = {
    access: CONTENT_CREATOR,
    email: "test_guest@onlyoffice.io",
    roomId: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.status, "Invited")
})

Files("doesn't invite a guest twice", async (context) => {
  const { perform } = inviteGuest.operation
  /** @type {InviteGuestFields} */
  const inputData = {
    access: CONTENT_CREATOR,
    email: "TEST_GUEST@onlyoffice.io",
    roomId: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.status, "User is already a member")
})

Files("create a folder in room", async (context) => {
  const { perform } = createFolder.operation
  /** @type {CreateFolderFields} */
  const inputData = {
    folderId: context.inputData.rooms.roomId,
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folder = await tester(perform, bundle)
  context.inputData.rooms.folderId = folder.id
  equal(folder.title, inputData.title)
})

Files("triggers when a folder is created in room", async (context) => {
  const { performList } = folderCreated.operation
  /** @type {FolderCreatedFields} */
  const inputData = {
    id: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.rooms.folderId)
})

Files("lists updated folders of the room", async (context) => {
  const { performList } = folderUpdated.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const folder = /** @type {import("../../docspace/files/files.js").FolderData} */ (folders[0])
  equal(folder.id, context.inputData.rooms.folderId)
})

Files("lists moved folders of the room", async (context) => {
  const { performList } = folderMoved.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const folder = /** @type {import("../../docspace/files/files.js").FolderData} */ (folders[0])
  equal(folder.id, context.inputData.rooms.folderId)
})

Files("hidden folders list trigger returns folders of the room", async (context) => {
  const { perform } = foldersList.operation
  const empty = await tester(perform, { authData: context.authData, inputData: {} })
  equal(empty, [])
  const bundle = {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId
    }
  }
  const folders = await tester(perform, bundle)
  equal(folders[0].id, context.inputData.rooms.folderId)
})

Files("search a folder in room", async (context) => {
  const { perform } = searchFolder.operation
  /** @type {SearchFields} */
  const inputData = {
    folderId: context.inputData.rooms.roomId, // Set section for search
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.rooms.folderId)
})

Files("creates a file in folder that is in room", async (context) => {
  const { perform } = createFile.operation
  /** @type {CreateFileFields} */
  const inputData = {
    folderId: context.inputData.rooms.folderId,
    title: "Test File"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const file = await tester(perform, bundle)
  context.inputData.rooms.fileId = file.id
  equal(file.folderId, inputData.folderId)
  equal(file.title, inputData.title)
})

Files("triggers when a file is created in folder that is in room", async (context) => {
  const { performList } = fileCreated.operation
  /** @type {FileCreatedFields} */
  const inputData = {
    folderId: context.inputData.rooms.folderId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const files = await tester(performList, bundle)
  const file = /** @type {import("../../docspace/files/files.js").FileData} */ (files[0])
  equal(file.title, "Test File")
})

Files("lists updated files of a folder that is in room", async (context) => {
  const { performList } = fileUpdated.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      folderId: context.inputData.rooms.folderId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const files = await tester(performList, bundle)
  const file = /** @type {import("../../docspace/files/files.js").FileData} */ (files[0])
  equal(file.title, "Test File")
})

Files("lists moved files of a folder that is in room", async (context) => {
  const { performList } = fileMoved.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      folderId: context.inputData.rooms.folderId
    }
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const files = await tester(performList, bundle)
  const file = /** @type {import("../../docspace/files/files.js").FileData} */ (files[0])
  equal(file.title, "Test File")
})

Files("hidden files list trigger returned file via folder id", async (context) => {
  const { perform } = filesList.operation
  /** @type {FilesListFields} */
  const inputData = {
    folderId: context.inputData.rooms.folderId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  equal(file.title, "Test File")
})

Files("gets the file by id", async (context) => {
  const { perform } = getFile.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      fileId: String(context.inputData.rooms.fileId)
    }
  }
  const file = await tester(perform, bundle)
  equal(file.id, context.inputData.rooms.fileId)
  equal(file.title, "Test File")
})

Files("gets the room by id", async (context) => {
  const { perform } = getRoom.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      id: String(context.inputData.rooms.roomId)
    }
  }
  const room = await tester(perform, bundle)
  equal(room.id, context.inputData.rooms.roomId)
})

Files("downloads file from folder that is in room", async (context) => {
  const { perform } = downloadFile.operation
  /** @type {DownloadFileFields} */
  const inputData = {
    fileId: context.inputData.rooms.fileId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  match(result.file, "hydrate|||")
  match(result.file, "hydrators.downloadFile")
})

Files("upload a file", async (context) => {
  const { perform } = uploadFile.operation
  /** @type {UploadFileFields} */
  const inputData = {
    folderId: context.inputData.rooms.folderId,
    url: "https://d2nlctn12v279m.cloudfront.net/assets/docs/samples/demo.docx"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.uploaded, true)
  not.equal(result.id, 0)
})

Files("finds the room by title", async (context) => {
  const { perform } = searchRoom.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      title: "test ROOM"
    }
  }
  const rooms = await tester(perform, bundle)
  const ids = rooms.map((room) => room.id)
  equal(ids.includes(context.inputData.rooms.roomId), true)
})

Files("search a file in room", async (context) => {
  const { perform } = searchFile.operation
  /** @type {SearchFields} */
  const inputData = {
    folderId: context.inputData.sections.rooms, // Set section for search
    title: "Test File"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  equal(file.folderId, context.inputData.rooms.folderId)
})

Files("search a file ignoring the case of the title", async (context) => {
  const { perform } = searchFile.operation
  /** @type {SearchFields} */
  const inputData = {
    folderId: context.inputData.sections.documents,
    title: "test file"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  not.equal(files.length, 0)
})

Files("renames a file", async (context) => {
  const file = await tester(createFile.operation.perform, {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId,
      title: "File to rename"
    }
  })
  const bundle = {
    authData: context.authData,
    inputData: {
      fileId: String(file.id),
      title: "Renamed file"
    }
  }
  const renamed = await tester(renameFile.operation.perform, bundle)
  equal(renamed.title, "Renamed file")
  equal(renamed.fileExst, ".docx")
})

Files("deletes a file permanently", async (context) => {
  const file = await tester(createFile.operation.perform, {
    authData: context.authData,
    inputData: {
      id: context.inputData.rooms.roomId,
      title: "File to delete"
    }
  })
  const bundle = {
    authData: context.authData,
    inputData: {
      fileId: String(file.id),
      immediately: true
    }
  }
  const result = await tester(deleteFile.operation.perform, bundle)
  equal(result.finished, true)
})

Files("renames the folder of the room", async (context) => {
  const bundle = {
    authData: context.authData,
    inputData: {
      folderId: String(context.inputData.rooms.folderId),
      title: "Test Folder renamed"
    }
  }
  const folder = await tester(renameFolder.operation.perform, bundle)
  equal(folder.title, "Test Folder renamed")
})

Files("delete a folder from room", async (context) => {
  const { perform } = deleteFolder.operation
  /** @type {DeleteFolderFields} */
  const inputData = {
    folderId: context.inputData.rooms.folderId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.finished, true)
})

// TODO: Add test for the file deleted trigger

Files("triggers when a folder is deleted", async (context) => {
  const { performList } = folderDeleted.operation
  const inputData = {
    id: context.inputData.rooms.roomId // Check triggers to delete a folder from a specific room
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.rooms.folderId)
})

Files("archive the room", async (context) => {
  const { perform } = archiveRoom.operation
  /** @type {ArchiveRoomFields} */
  const inputData = {
    id: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.finished, true)
})

Files("triggers when a room is archived", async (context) => {
  const { performList } = roomArchived.operation
  const bundle = {
    authData: context.authData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const room = folders[0]
  equal(room.id, context.inputData.rooms.roomId)
})

Files("creates a file in the my documents", async (context) => {
  const { perform } = createFileInMyDocuments.operation
  /** @type {CreateFileInMyDocumentsFields} */
  const inputData = {
    title: "Test File"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const file = await tester(perform, bundle)
  context.inputData.myDocuments.fileId = file.id
  equal(file.title, "Test File")
})

Files("triggers when a file is created in my documents", async (context) => {
  const { performList } = fileCreatedInMyDocuments.operation
  const bundle = {
    authData: context.authData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const files = await tester(performList, bundle)
  const file = files[0]
  equal(file.id, context.inputData.myDocuments.fileId)
})

Files("hidden files list trigger returned file via my document", async (context) => {
  const { perform } = filesList.operation
  /** @type {FilesListFields} */
  const inputData = {
    id: context.inputData.sections.documents
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  equal(file.title, "Test File")
  equal(file.id, context.inputData.myDocuments.fileId)
})

Files("create a folder in the my documents", async (context) => {
  const { perform } = createFolderInMyDocuments.operation
  /** @type {CreateFolderInMyDocumentsFields} */
  const inputData = {
    title: "Test Folder"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folder = await tester(perform, bundle)
  context.inputData.myDocuments.folderId.id = folder.id
  equal(folder.title, "Test Folder")
})

Files("triggers when a folder is created in the my documents", async (context) => {
  const { performList } = folderCreatedInMyDocuments.operation
  const bundle = {
    authData: context.authData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.myDocuments.folderId.id)
})

Files("creates a file in the folder that is in my documents", async (context) => {
  const { perform } = createFileInMyDocuments.operation
  /** @type {CreateFileInMyDocumentsFields} */
  const inputData = {
    folderId: context.inputData.myDocuments.folderId.id,
    title: "Test File"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const file = await tester(perform, bundle)
  context.inputData.myDocuments.folderId.fileId = file.id
  equal(file.folderId, context.inputData.myDocuments.folderId.id)
  equal(file.title, "Test File")
})

Files("triggers when a file is created in the folder that is in my documents", async (context) => {
  const { performList } = fileCreatedInMyDocuments.operation
  /** @type {FileCreatedInMyDocumentsFields} */
  const inputData = {
    folderId: context.inputData.myDocuments.folderId.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const files = await tester(performList, bundle)
  const file = /** @type {import("../../docspace/files/files.js").FileData} */ (files[0])
  equal(file.id, context.inputData.myDocuments.folderId.fileId)
  equal(file.folderId, context.inputData.myDocuments.folderId.id)
})

Files("downloads file from my documents", async (context) => {
  const { perform } = downloadFileFromMyDocuments.operation
  /** @type {DownloadFileFromMyDocumentsFields} */
  const inputData = {
    fileId: context.inputData.myDocuments.folderId.fileId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const hydrate = await tester(perform, bundle)
  context.inputData.hydrate = hydrate.file
  match(hydrate.file, "hydrate|||")
})

Files("upload a file to My Documents", async (context) => {
  const { perform } = uploadFileToMyDocuments.operation
  /** @type {UploadFileToMyDocumentsFields} */
  const inputData = {
    url: "https://d2nlctn12v279m.cloudfront.net/assets/docs/samples/demo.docx"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.uploaded, true)
  not.equal(result.id, 0)
})

Files("delete a folder from my documents", async (context) => {
  const { perform } = deleteFolderInMyDocuments.operation
  /** @type {DeleteFolderInMyDocumentsFields} */
  const inputData = {
    folderId: context.inputData.myDocuments.folderId.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const result = await tester(perform, bundle)
  equal(result.finished, true)
})

Files("triggers when a folder from my documents is deleted", async (context) => {
  const { performList } = folderDeletedInMyDocuments.operation
  const bundle = {
    authData: context.authData
  }
  if (!performList) {
    throw new Error("performList is required")
  }
  const folders = await tester(performList, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.myDocuments.folderId.id)
})

Files.run()
