//
// (c) Copyright Ascensio System SIA 2024
//

// @ts-check

/**
 * @typedef {import("./files.js").Account} Account
 * @typedef {import("./files.js").DownloadFileData} DownloadFileData
 * @typedef {import("./files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("./files.js").FileData} FileData
 * @typedef {import("./files.js").FolderData} FolderData
 * @typedef {import("./files.js").PathParts} PathParts
 * @typedef {import("./files.js").ProgressData} ProgressData
 * @typedef {import("./files.js").RoomData} RoomData
 * @typedef {import("./files.js").RoleData} RoleData
 * @typedef {import("./files.js").SharedTo} SharedTo
 * @typedef {import("./files.js").ShareData} _ShareData
 * @typedef {import("./files.js").UploadFileData} UploadFileData
 */

const { account } = require("../people/people.samples.js")

/** @type {DownloadFileData} */
const hydratedFile = {
  file: "hydrate||| |||hydrate",
  id: 1
}

/** @type {FileData} */
const file = {
  created: "2023-01-01T12:00:00.0000000+03:00",
  createdBy: account,
  fileExst: ".docx",
  fileType: 7,
  folderId: 3,
  id: 2,
  rootFolderId: 1,
  rootFolderType: 14,
  title: "README.docx",
  updated: "2023-01-01T12:00:00.0000000+03:00",
  updatedBy: account,
  viewUrl: "https://example.onlyoffice.io/filehandler.ashx?action=download&fileid=2",
  webUrl: "https://example.onlyoffice.io/doceditor?fileid=2&version=1"
}

/** @type {FolderData} */
const folder = {
  created: "2023-01-01T13:00:00.0000000+03:00",
  createdBy: account,
  id: 2,
  parentId: 1,
  rootFolderType: 14,
  title: "Test Folder",
  updated: "2023-01-01T13:00:00.0000000+03:00",
  updatedBy: account
}

/** @type {SharedTo} */
const sharedTo = {
  denyDownload: false,
  id: "00000000-1111-2222-3333-444444444444",
  isExpired: false,
  linkType: 1,
  primary: true,
  requestToken: "TOKEN",
  shareLink: "https://example.onlyoffice.io/s/link_to_room",
  title: "Access link"
}

/** @type {ExternalLinkData} */
const externalLink = {
  access: 2,
  canEditAccess: false,
  isLocked: false,
  isOwner: false,
  sharedTo
}

/** @type {PathParts} */
const pathParts = {
  id: 1,
  title: "Rooms"
}

/** @type {ProgressData} */
const progress = {
  error: "",
  finished: false,
  id: "00000000-1111-2222-3333-444444444444",
  operation: 0,
  processed: "0",
  progress: 0
}

/** @type {RoleData} */
const role = {
  id: 1,
  name: "Viewer"
}

/** @type {RoomData} */
const room = {
  created: "2023-01-01T13:00:00.0000000+03:00",
  createdBy: account,
  filesCount: 1,
  foldersCount: 1,
  id: 2,
  new: 0,
  parentId: 1,
  roomType: 5,
  rootFolderId: 1,
  rootFolderType: 14,
  title: "My Room",
  updated: "2023-01-01T13:00:00.0000000+03:00",
  updatedBy: account
}

/** @type {_ShareData} */
const share = {
  "activationStatus": 2,
  "displayName": "example@onlyoffice.io",
  "email": "example@onlyoffice.io",
  "firstName": "John",
  "id": "11111111-2222-3333-4444-555555555555",
  "isAdmin": false,
  "isCollaborator": true,
  "isLDAP": false,
  "isOwner": false,
  "isRoomAdmin": false,
  "isSSO": false,
  "isVisitor": false,
  "lastName": "Doe",
  "profileUrl": "https://example.onlyoffice.io/accounts/view/example",
  "quotaLimit": 0,
  "status": 1,
  "usedSpace": 0,
  "userName": "example"
}

/** @type {UploadFileData} */
const upload = {
  bytes_total: 100,
  created: "2023-01-01T12:00:00.0000000Z",
  expired: "2023-01-01T12:00:00.0100000Z",
  id: "00000000000000000000000000000000",
  location: "https://example.onlyoffice.io/ChunkedUploader.ashx?uid=00000000000000000000000000000000",
  path: [28788]
}

module.exports = {
  externalLink,
  file,
  folder,
  hydratedFile,
  pathParts,
  progress,
  role,
  room,
  share,
  upload
}
