//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

/**
 * @typedef {import("./files.js").DownloadFileData} DownloadFileData
 * @typedef {import("./files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("./files.js").FileData} FileData
 * @typedef {import("./files.js").FolderData} FolderData
 * @typedef {import("./files.js").InviteGuestData} InviteGuestData
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

const CREATED = "2026-01-01T09:00:00.0000000+00:00"

/** @type {FileData} */
const file = {
  comment: "Created",
  contentLength: "7.54 KB",
  created: CREATED,
  createdBy: account,
  fileEntryType: 2,
  fileExst: ".docx",
  fileStatus: 0,
  fileType: 7,
  folderId: 3,
  id: 4,
  pureContentLength: 7726,
  rootFolderId: 1,
  rootFolderType: 14,
  thumbnailStatus: 1,
  // The file triggers and actions return the title without the extension.
  title: "Report",
  updated: CREATED,
  updatedBy: account,
  version: 1,
  versionGroup: 1,
  viewUrl: "https://example.onlyoffice.com/filehandler.ashx?action=download&fileid=4",
  webUrl: "https://example.onlyoffice.com/doceditor?fileid=4&version=1"
}

/** @type {FileData} */
const foundFile = {
  ...file,
  title: "Report.docx"
}

/** @type {FolderData} */
const folder = {
  created: CREATED,
  createdBy: account,
  fileEntryType: 1,
  filesCount: 1,
  foldersCount: 0,
  id: 3,
  new: 0,
  parentId: 2,
  rootFolderId: 1,
  rootFolderType: 14,
  title: "Contracts",
  updated: CREATED,
  updatedBy: account
}

/** @type {SharedTo} */
const sharedLink = {
  denyDownload: false,
  id: "33333333-4444-5555-6666-777777777777",
  internal: false,
  isExpired: false,
  linkType: 1,
  primary: true,
  requestToken: "TOKEN",
  shareLink: "https://example.onlyoffice.com/s/abcdefghijklmno",
  title: "Shared link"
}

/** @type {ExternalLinkData} */
const externalLink = {
  access: 2,
  canEditAccess: false,
  canEditDenyDownload: true,
  canEditExpirationDate: false,
  canEditInternal: false,
  canRevoke: true,
  isLocked: false,
  isOwner: false,
  sharedLink,
  sharedTo: sharedLink,
  subjectType: 4
}

/** @type {InviteGuestData} */
const inviteGuest = {
  status: "Invited"
}

/** @type {PathParts} */
const pathParts = {
  id: 1,
  title: "Rooms"
}

/** @type {ProgressData} */
const progress = {
  Operation: 0,
  error: "",
  finished: true,
  folders: [],
  id: "00000000-1111-2222-3333-444444444444",
  processed: "1",
  progress: 100,
  status: 2
}

/** @type {RoleData} */
const role = {
  id: 2,
  name: "Viewer"
}

/** @type {RoomData} */
const room = {
  created: CREATED,
  createdBy: account,
  denyDownload: false,
  fileEntryType: 1,
  filesCount: 1,
  foldersCount: 1,
  id: 2,
  inRoom: true,
  indexing: false,
  new: 0,
  parentId: 1,
  private: false,
  roomType: 5,
  rootFolderId: 1,
  rootFolderType: 14,
  tags: [],
  title: "Project room",
  updated: CREATED,
  updatedBy: account,
  usedSpace: 7726
}

/** @type {_ShareData} */
const share = {
  activationStatus: 1,
  avatar: "/static/images/default_user_photo_size_82-82.png",
  avatarMax: "/static/images/default_user_photo_size_200-200.png",
  avatarMedium: "/static/images/default_user_photo_size_48-48.png",
  avatarOriginal: "/static/images/default_user_photo_size_200-200.png",
  avatarSmall: "/static/images/default_user_photo_size_32-32.png",
  department: "",
  displayName: "John Doe",
  email: "john.doe@example.com",
  firstName: "John",
  hasAvatar: false,
  id: "11111111-2222-3333-4444-555555555555",
  isAdmin: false,
  isAnonim: false,
  isCollaborator: true,
  isLDAP: false,
  isOwner: false,
  isRoomAdmin: false,
  isSSO: false,
  isVisitor: false,
  lastName: "Doe",
  mobilePhoneActivationStatus: 0,
  profileUrl: "https://example.onlyoffice.com/accounts/people/filter?search=john.doe%40example.com",
  registrationDate: CREATED,
  status: 1,
  userName: "john.doe"
}

/** @type {UploadFileData} */
const upload = {
  file,
  folderId: 3,
  id: 2,
  title: "README.docx",
  uploaded: true,
  version: 1
}

module.exports = {
  account,
  externalLink,
  file,
  folder,
  foundFile,
  hydratedFile,
  inviteGuest,
  pathParts,
  progress,
  role,
  room,
  share,
  upload
}
