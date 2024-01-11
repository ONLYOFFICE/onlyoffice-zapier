//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @typedef {import("./files.js").Account} Account
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

/** @type {FileData} */
const file = {
  folderId: 3,
  viewUrl: "https://example.onlyoffice.io/filehandler.ashx?action=download&fileid=2",
  webUrl: "https://example.onlyoffice.io/doceditor?fileid=2&version=1",
  fileType: 7,
  fileExst: ".docx",
  id: 2,
  rootFolderId: 1,
  title: "README.docx",
  created: "2023-01-01T12:00:00.0000000+03:00",
  createdBy: account,
  updated: "2023-01-01T12:00:00.0000000+03:00",
  rootFolderType: 14,
  updatedBy: account
}

/** @type {FolderData} */
const folder = {
  parentId: 1,
  id: 2,
  title: "Test Folder",
  created: "2023-01-01T13:00:00.0000000+03:00",
  createdBy: account,
  updated: "2023-01-01T13:00:00.0000000+03:00",
  rootFolderType: 14,
  updatedBy: account
}

/** @type {SharedTo} */
const sharedTo = {
  id: "00000000-1111-2222-3333-444444444444",
  title: "Access link",
  shareLink: "https://example.onlyoffice.io/s/link_to_room",
  linkType: 1,
  denyDownload: false,
  isExpired: false,
  primary: true,
  requestToken: "TOKEN"
}

/** @type {ExternalLinkData} */
const externalLink = {
  access: 2,
  sharedTo,
  isLocked: false,
  isOwner: false,
  canEditAccess: false
}

/** @type {PathParts} */
const pathParts = {
  title: "Rooms",
  id: 1
}

/** @type {ProgressData} */
const progress = {
  id: "00000000-1111-2222-3333-444444444444",
  operation: 0,
  progress: 0,
  error: "",
  processed: "0",
  finished: false
}

/** @type {RoleData} */
const role = {
  id: 1,
  name: "Viewer"
}

/** @type {RoomData} */
const room = {
  id: 2,
  title: "My Room",
  parentId: 1,
  filesCount: 1,
  foldersCount: 1,
  new: 0,
  roomType: 5,
  rootFolderId: 1,
  created: "2023-01-01T13:00:00.0000000+03:00",
  createdBy: account,
  updated: "2023-01-01T13:00:00.0000000+03:00",
  rootFolderType: 14,
  updatedBy: account
}

/** @type {_ShareData} */
const share = {
  "firstName": "John",
  "lastName": "Doe",
  "userName": "example",
  "email": "example@onlyoffice.io",
  "status": 1,
  "activationStatus": 2,
  "isAdmin": false,
  "isRoomAdmin": false,
  "isLDAP": false,
  "isOwner": false,
  "isVisitor": false,
  "isCollaborator": true,
  "isSSO": false,
  "quotaLimit": 0,
  "usedSpace": 0,
  "id": "11111111-2222-3333-4444-555555555555",
  "displayName": "example@onlyoffice.io",
  "profileUrl": "https://alexandersalyakhov.onlyoffice.io/accounts/view/example"
}

/** @type {UploadFileData} */
const upload = {
  id: 3,
  folderId: 1,
  version: 1,
  title: "sample.docx",
  uploaded: true,
  file
}

module.exports = {
  file,
  folder,
  externalLink,
  pathParts,
  progress,
  role,
  room,
  share,
  upload
}
