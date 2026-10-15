//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const {
  ACTIVATION_STATUS,
  aiRoomRoles,
  Client,
  collaborationRoomRoles,
  customRoomRoles,
  fillingFormsRoomRoles,
  isAiRoom,
  isCollaborationRoom,
  isCustomRoom,
  isFillingFormsRoom,
  isPublicRoom,
  isVirtualDataRoom,
  normalizeId,
  publicRoomRoles,
  REMOVED_USER_ID,
  ROOM_MANAGER,
  stripExtension,
  virtualDataRoomRoles
} = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { PeopleService } = require("../../docspace/people/people.js")
const { createWebhookTrigger } = require("../webhooks/hooks.js")
const { pageFilters } = require("../pagination.js")
const {
  FILE_CREATED,
  FILE_DELETED,
  FILE_UPLOADED,
  FOLDER_CREATED,
  FOLDER_DELETED,
  ROOM_ARCHIVED
} = require("../../docspace/webhooks/events.js")

/**
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspace/files/files.js").PathParts} PathParts
 * @typedef {import("../../docspace/files/files.js").RoleData} RoleData
 * @typedef {import("../../docspace/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

/**
 * @typedef {Object} FileCreatedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FileDeletedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FileCreatedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FileDeletedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FilesListFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FilesListFromMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderCreatedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderCreatedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderDeletedFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderDeletedInMyDocumentsFields
 * @property {number=} folderId
 */

/**
 * @typedef {object} ShareRolesFields
 * @property {number} roomId
 * @property {string=} userId
 */

/**
 * @typedef {Object} UserInvitedFields
 * @property {number} id
 * @property {boolean} active
 */

/**
 * @param {FileData} file
 * @returns {FileData}
 */
function normalizeFile(file) {
  file.title = stripExtension(file.title)
  file.id = normalizeId(file.id)
  return file
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileCreatedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileCreated(z, bundle) {
  if (!bundle.inputData.folderId) {
    bundle.inputData.folderId = bundle.inputData.id
  }
  if (bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const filters = {
      ...pageFilters(bundle),
      filterType: "FilesOnly",
      sortBy: "DateAndTimeCreation",
      sortOrder: "descending"
    }
    const filesList = await files.listFiles(bundle.inputData.folderId, filters)
    return filesList.files.slice(0, 100).map(normalizeFile)
  }
  throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
}

const fileCreated = createWebhookTrigger(
  "fileCreated",
  "File Created",
  "Triggers when a file is created in a room or folder.",
  [
    FILE_CREATED,
    FILE_UPLOADED
  ],
  {
    filters: { rootFolderType: 14 },
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Triggers when created from a specific room",
        key: "id",
        label: "Room id",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "Triggers when created from a specific folder",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    pollingFallback: performFileCreated,
    sample: samples.file
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileCreatedInMyDocumentsFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileCreatedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFileCreated(z, bundle)
}

const fileCreatedInMyDocuments = createWebhookTrigger(
  "fileCreatedInMyDocuments",
  "File Created in Files Section",
  "Triggers when a file is created in the Files section.",
  [
    FILE_CREATED,
    FILE_UPLOADED
  ],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when created from a specific folder of the Files section (optional)",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    pollingFallback: performFileCreatedInMyDocuments,
    sample: samples.file
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileDeletedFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileDeleted(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    filterType: "FilesOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const trash = await files.listTrash(filters)
  trash.files.forEach(normalizeFile)
  if (bundle.inputData.id || bundle.inputData.folderId) {
    if (!bundle.inputData.folderId) {
      bundle.inputData.folderId = bundle.inputData.id
    }
    return trash.files.filter((item) => String(item.originId) === String(bundle.inputData.folderId))
  }
  return trash.files
}

const fileDeleted = createWebhookTrigger(
  "fileDeleted",
  "File Deleted",
  "Triggers when a file is deleted (optionally from a room or folder).",
  [FILE_DELETED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Triggers when deleted from a specific room (optional)",
        key: "id",
        label: "Room id",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "Triggers when deleted from a specific folder (optional)",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    pollingFallback: performFileDeleted,
    sample: samples.file
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FileDeletedInMyDocumentsFields>} bundle
 * @returns {Promise<FileData[]>}
 */
async function performFileDeletedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFileDeleted(z, bundle)
}

const fileDeletedInMyDocuments = createWebhookTrigger(
  "fileDeletedInMyDocuments",
  "File Deleted From Files Section",
  "Triggers when a file is deleted from the Files section.",
  [FILE_DELETED],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when deleted from a specific folder of the Files section (optional)",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    normalize: normalizeFile,
    noun: "File",
    pollingFallback: performFileDeletedInMyDocuments,
    sample: samples.file
  }
)

const filesList = {
  display: {
    description: "Hidden trigger to get a list of files from a folder or room.",
    hidden: true,
    label: "List of Files"
  },
  key: "filesList",
  noun: "Files",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FilesListFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      bundle.inputData.folderId = bundle.inputData.folderId || bundle.inputData.id
      return performFileCreated(z, bundle)
    },
    sample: samples.file
  }
}

const filesListFromMyDocuments = {
  display: {
    description: "Hidden trigger to get a list of files from the Files section.",
    hidden: true,
    label: "List of Files from Files Section"
  },
  key: "filesListFromMyDocuments",
  noun: "Files",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FilesListFromMyDocumentsFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return performFileCreated(z, bundle)
    },
    sample: samples.file
  }
}

const filteredSections = {
  display: {
    description: "Hidden trigger to get all sections.",
    hidden: true,
    label: "Filtered Sections"
  },
  key: "filteredSections",
  noun: "Sections",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
     * @returns {Promise<PathParts[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const sections = await files.listSections()
      return sections.map((section) => ({
        id: Number(section.pathParts[0].id),
        title: section.pathParts[0].title
      }))
    },
    sample: samples.pathParts
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderCreated(z, bundle) {
  if (!bundle.inputData.id) {
    bundle.inputData.id = bundle.inputData.folderId
  }
  if (bundle.inputData.id) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const filters = {
      ...pageFilters(bundle),
      filterType: "FoldersOnly",
      sortBy: "DateAndTimeCreation",
      sortOrder: "descending"
    }
    const folders = await files.listFolders(bundle.inputData.id, filters)
    folders.folders.forEach((folder) => {
      folder.id = normalizeId(folder.id)
    })
    return folders.folders.slice(0, 100)
  }
  throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
}

const folderCreated = createWebhookTrigger(
  "folderCreated",
  "Folder Created",
  "Triggers when a folder is created in a room or folder.",
  [FOLDER_CREATED],
  {
    filters: { rootFolderType: 14 },
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Triggers when created from a specific room",
        key: "id",
        label: "Room id",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "Triggers when created from a specific folder",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    noun: "Folder",
    pollingFallback: performFolderCreated,
    sample: samples.folder
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderCreatedInMyDocumentsFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderCreatedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFolderCreated(z, bundle)
}

const folderCreatedInMyDocuments = createWebhookTrigger(
  "folderCreatedInMyDocuments",
  "Folder Created in Files Section",
  "Triggers when a folder is created in the Files section.",
  [FOLDER_CREATED],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when created from a specific folder of the Files section (optional)",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    noun: "Folder",
    pollingFallback: performFolderCreatedInMyDocuments,
    sample: samples.folder
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderDeletedFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderDeleted(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    filterType: "FoldersOnly",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const trash = await files.listTrash(filters)
  trash.folders.forEach((folder) => {
    folder.id = normalizeId(folder.id)
  })
  if (bundle.inputData.folderId) {
    return trash.folders.filter((item) => String(item.originId) === String(bundle.inputData.folderId))
  } else if (bundle.inputData.id) {
    return trash.folders.filter((item) => String(item.originId) === String(bundle.inputData.id))
  }
  return trash.folders
}

const folderDeleted = createWebhookTrigger(
  "folderDeleted",
  "Folder Deleted",
  "Triggers when a folder is deleted (optionally from a room or folder).",
  [FOLDER_DELETED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Triggers when deleted from a specific room (optional)",
        key: "id",
        label: "Room id",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "Triggers when deleted from a specific folder (optional)",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    noun: "Folder",
    pollingFallback: performFolderDeleted,
    sample: samples.folder
  }
)

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, FolderDeletedInMyDocumentsFields>} bundle
 * @returns {Promise<FolderData[]>}
 */
async function performFolderDeletedInMyDocuments(z, bundle) {
  if (!bundle.inputData.folderId) {
    const client = new Client(bundle.authData.baseUrl, z.request)
    const files = new FilesService(client)
    const folderId = await files.myDocumentsSection()
    bundle.inputData.folderId = folderId.pathParts[0].id
  }
  return performFolderDeleted(z, bundle)
}

const folderDeletedInMyDocuments = createWebhookTrigger(
  "folderDeletedInMyDocuments",
  "Folder Deleted From Files Section",
  "Triggers when a folder is deleted from the Files section.",
  [FOLDER_DELETED],
  {
    filters: { rootFolderType: 5 },
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when deleted from a specific folder of the Files section (optional)",
        key: "folderId",
        label: "Folder id",
        type: "string"
      }
    ],
    noun: "Folder",
    pollingFallback: performFolderDeletedInMyDocuments,
    sample: samples.folder
  }
)

const foldersList = {
  display: {
    description: "Hidden trigger to get a list of folders from a folder or room.",
    hidden: true,
    label: "List of Folders"
  },
  key: "foldersList",
  noun: "Folders",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      // The dropdown is empty until a room or folder is selected.
      if (!bundle.inputData.id && !bundle.inputData.folderId) {
        return []
      }
      return performFolderCreated(z, bundle)
    },
    sample: samples.folder
  }
}

const foldersInMyDocumentsList = {
  display: {
    description: "Hidden trigger to get a list of folders from the Files section.",
    hidden: true,
    label: "List of Folders from Files Section"
  },
  key: "foldersInMyDocumentsList",
  noun: "Folders",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const folderId = await files.myDocumentsSection()
      const refinedBundle = {
        ...bundle,
        inputData: {
          ...bundle.inputData,
          id: folderId.pathParts[0].id
        }
      }
      return await performFolderCreated(z, refinedBundle)
    },
    sample: samples.folder
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {Promise<RoomData[]>}
 */
async function performRoomCreated(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  // Without sorting, DocSpace uses the order from its interface, so new rooms
  // can be missing from the first page.
  const filters = {
    ...pageFilters(bundle),
    sortBy: "DateAndTimeCreation",
    sortOrder: "descending"
  }
  const rooms = await files.listRooms(filters)
  // Form filling rooms are in the separate Forms section and aren't returned
  // by default.
  const forms = await files.listRooms({
    ...filters,
    searchArea: "Forms"
  })
  const ids = new Set(rooms.folders.map((room) => String(room.id)))
  const list = rooms.folders
    .concat(forms.folders.filter((room) => !ids.has(String(room.id))))
    .sort((a, b) => Date.parse(b.created) - Date.parse(a.created))
  list.forEach((room) => {
    room.id = normalizeId(room.id)
  })
  // Return both lists in full, so that no room is lost between pages.
  return list
}

// Only Full admins and Room admins can subscribe to the `room.created` event,
// so this trigger uses polling.
const roomCreated = {
  display: {
    description: "Triggers when a room is created.",
    label: "Room Created"
  },
  key: "roomCreated",
  noun: "Room",
  operation: {
    canPaginate: true,
    perform: performRoomCreated,
    sample: samples.room
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {Promise<RoomData[]>}
 */
async function performRoomArchived(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const filters = {
    searchArea: "Archive",
    sortBy: "DateAndTime",
    sortOrder: "descending"
  }
  const rooms = await files.listRooms(filters)
  rooms.folders.forEach((room) => {
    room.id = normalizeId(room.id)
  })
  return rooms.folders
}

const roomArchived = createWebhookTrigger(
  "roomArchived",
  "Room Archived",
  "Triggers when a room is archived.",
  [ROOM_ARCHIVED],
  {
    noun: "Room",
    pollingFallback: performRoomArchived,
    sample: samples.room
  }
)

/**
 * Collaboration rooms, virtual data rooms and AI rooms don't have external
 * links.
 * @param {number} roomType
 * @returns {boolean}
 */
function supportsExternalLinks(roomType) {
  return !isCollaborationRoom(roomType) && !isVirtualDataRoom(roomType) && !isAiRoom(roomType)
}

const roomsFiltered = {
  display: {
    description: "Hidden trigger to get a list of rooms that support external links.",
    hidden: true,
    label: "Rooms With External Links"
  },
  key: "roomsFiltered",
  noun: "Room",
  operation: {
    canPaginate: true,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const rooms = await performRoomCreated(z, bundle)
      return rooms.filter((room) => supportsExternalLinks(Number(room.roomType)))
    },
    sample: samples.room
  }
}

const shareRoles = {
  display: {
    description: "Hidden trigger to get roles to share by the room ID.",
    hidden: true,
    label: "Get Roles"
  },
  key: "shareRoles",
  noun: "Role",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ShareRolesFields>} bundle
     * @returns {Promise<RoleData[]>}
     */
    async perform(z, bundle) {
      /**
       * @type {RoleData[]}
       */
      var roles = []
      const client = new Client(bundle.authData.baseUrl, z.request)
      // checking user rights
      const people = new PeopleService(client)
      const user = await people.self()
      if (!user?.isAdmin && !user?.isRoomAdmin && !user?.isOwner) {
        // user not have permission to invite a user to the room
        return roles
      }
      const files = new FilesService(client)
      const room = await files.roomInfo(bundle.inputData.roomId)
      const roomType = Number(room.roomType)
      if (bundle.inputData.userId) {
        const foundUser = await people.user(bundle.inputData.userId)
        // Room manager is a paid role. Only the owner, Full admins and Room
        // admins can have it.
        if (foundUser?.isOwner || foundUser?.isAdmin || foundUser?.isRoomAdmin) {
          roles.push({ id: ROOM_MANAGER, name: "Room manager" })
        }
      }
      if (isPublicRoom(roomType)) {
        roles = roles.concat(publicRoomRoles())
      }
      if (isCustomRoom(roomType)) {
        roles = roles.concat(customRoomRoles())
      }
      if (isFillingFormsRoom(roomType)) {
        roles = roles.concat(fillingFormsRoomRoles())
      }
      if (isCollaborationRoom(roomType)) {
        roles = roles.concat(collaborationRoomRoles())
      }
      if (isVirtualDataRoom(roomType)) {
        roles = roles.concat(virtualDataRoomRoles())
      }
      if (isAiRoom(roomType)) {
        roles = roles.concat(aiRoomRoles())
      }
      roles.forEach((role) => {
        role.id = Number(role.id)
      })
      return roles
    },
    sample: samples.role
  }
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, UserInvitedFields>} bundle
 * @returns {Promise<User[]>}
 */
async function performUserInvited(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const members = await files.listUsers(bundle.inputData.id, {})
  // The list has users and groups. Only users have `sharedToUser`.
  /** @type {User[]} */
  let users = []
  members.forEach((item) => {
    if (item.sharedToUser && item.sharedToUser.id !== REMOVED_USER_ID) {
      users.push(item.sharedToUser)
    }
  })
  // Boolean fields may come from Zapier as strings.
  if (String(bundle.inputData.active) === "true") {
    users = users.filter((item) => item.activationStatus === ACTIVATION_STATUS)
  }
  return users
}

// DocSpace has no webhook event for adding a user to a room. The
// `user.invited` event is about invitations to the workspace, so this trigger
// uses polling.
const userInvited = {
  display: {
    description: "Triggers when a user is invited to the room.",
    label: "User Joined"
  },
  key: "userInvited",
  noun: "User",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room id",
        required: true,
        type: "string"
      },
      {
        helpText: "Returns only those who are active",
        key: "active",
        label: "active",
        type: "boolean"
      }
    ],
    perform: performUserInvited,
    sample: samples.share
  }
}

module.exports = {
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
  foldersList,
  roomArchived,
  roomCreated,
  roomsFiltered,
  shareRoles,
  userInvited
}
