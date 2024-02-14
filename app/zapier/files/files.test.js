//
// (c) Copyright Ascensio System SIA 2023
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
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  roomCreate,
  shareRoom,
  uploadFile,
  uploadFileToMyDocuments
} = require("./actions.js")
const {
  fileCreated,
  fileCreatedInMyDocuments,
  fileDeleted,
  //fileDeletedInMyDocuments, TODO:
  filesList,
  //filesListFromMyDocuments, TODO:
  filteredSections,
  folderCreated,
  folderCreatedInMyDocuments,
  folderDeleted,
  folderDeletedInMyDocuments,
  //foldersInMyDocumentsList, TODO:
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
 * @typedef {import("./triggers.js").FolderCreatedInMyDocumentsFields} FolderCreatedInMyDocumentsFields
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
      myDocuments: 0,
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
    case "My documents":
      context.inputData.sections.myDocuments = item.id
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
  not.equal(context.inputData.sections.myDocuments, 0)
  not.equal(context.inputData.sections.trash, 0)
  not.equal(context.inputData.sections.rooms, 0)
  not.equal(context.inputData.sections.archive, 0)
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

Files("hidden share roles trigger return roles", async (context) => {
  const { perform } = shareRoles.operation
  /** @type {ShareRolesFields} */
  const inputData = {
    id: context.inputData.rooms.roomId
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
  const { perform } = folderCreated.operation
  /** @type {FolderCreatedFields} */
  const inputData = {
    id: context.inputData.rooms.roomId
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.rooms.folderId)
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
  const { perform } = fileCreated.operation
  /** @type {FileCreatedFields} */
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
  not.equal(result.bytes_total, 0)
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

// TODO: Add test for delete file action and trigger

Files("triggers when a folder is deleted", async (context) => {
  const { perform } = folderDeleted.operation
  const inputData = {
    id: context.inputData.rooms.roomId // Check triggers to delete a folder from a specific room
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const folders = await tester(perform, bundle)
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
  const { perform } = roomArchived.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
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
  const { perform } = fileCreatedInMyDocuments.operation
  const bundle = {
    authData: context.authData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
  equal(file.id, context.inputData.myDocuments.fileId)
})

Files("hidden files list trigger returned file via my document", async (context) => {
  const { perform } = filesList.operation
  /** @type {FilesListFields} */
  const inputData = {
    id: context.inputData.sections.myDocuments
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
  const { perform } = folderCreatedInMyDocuments.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
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
  const { perform } = fileCreatedInMyDocuments.operation
  /** @type {FileCreatedInMyDocumentsFields} */
  const inputData = {
    folderId: context.inputData.myDocuments.folderId.id
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const files = await tester(perform, bundle)
  const file = files[0]
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
  not.equal(result.bytes_total, 0)
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
  const { perform } = folderDeletedInMyDocuments.operation
  const bundle = {
    authData: context.authData
  }
  const folders = await tester(perform, bundle)
  const folder = folders[0]
  equal(folder.id, context.inputData.myDocuments.folderId.id)
})

Files.run()
