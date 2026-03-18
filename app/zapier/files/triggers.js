//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const {
  ACTIVATION_STATUS,
  Client,
  collaborationRoomRoles,
  customRoomRoles,
  fillingFormsRoomRoles,
  isCollaborationRoom,
  isCustomRoom,
  isFillingFormsRoom,
  isPublicRoom,
  isVirtualDataRoom,
  ONLY_USERS_FILTER_TYPE,
  publicRoomRoles,
  REMOVED_USER_ID,
  ROOM_MANAGER,
  virtualDataRoomRoles
} = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { PeopleService } = require("../../docspace/people/people.js")
const { user } = require("../../docspace/people/people.samples.js")
const { createWebhookTrigger } = require("../webhooks/hooks.js")
const {
  FILE_CREATED,
  FILE_DELETED,
  FOLDER_CREATED,
  FOLDER_DELETED,
  ROOM_ARCHIVED,
  ROOM_CREATED,
  ROOM_USER_ADDED
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
      filterType: "FilesOnly",
      sortBy: "DateAndTime",
      sortOrder: "descending"
    }
    const filesList = await files.listFiles(bundle.inputData.folderId, filters)
    filesList.files.forEach((file) => {
      file.title = file.title.substring(0, file.title.lastIndexOf("."))
      file.id = Number(file.id)
    })
    return filesList.files.slice(0, 100)
  }
  throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
}

const fileCreated = createWebhookTrigger(
  "fileCreated",
  "File Created",
  "Triggers when a file is created in a room or folder.",
  [FILE_CREATED],
  {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Triggers when created from a specific room",
        key: "id",
        label: "Room id",
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        helpText: "Triggers when created from a specific folder",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
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
  "File Created in My Documents",
  "Triggers when a file is created in the My Documents directory.",
  [FILE_CREATED],
  {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when created from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
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
  trash.files.forEach((file) => {
    file.title = file.title.substring(0, file.title.lastIndexOf("."))
    file.id = Number(file.id)
  })
  if (bundle.inputData.id || bundle.inputData.folderId) {
    if (!bundle.inputData.folderId) {
      bundle.inputData.folderId = bundle.inputData.id
    }
    return trash.files.filter((item) => item.originId === bundle.inputData.folderId)
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
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        helpText: "Triggers when deleted from a specific folder (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
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
  "File Deleted From My Documents",
  "Triggers when a file is deleted from the My Documents directory.",
  [FILE_DELETED],
  {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when deleted from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
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
    description: "Hidden trigger to get a list of files from the My Documents directory.",
    hidden: true,
    label: "List of Files from My Documents"
  },
  key: "filesListFromMyDocuments",
  noun: "Files",
  operation: {
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
      filterType: "FoldersOnly",
      sortBy: "DateAndTime",
      sortOrder: "descending"
    }
    const folders = await files.listFolders(bundle.inputData.id, filters)
    folders.folders.forEach((folder) => {
      folder.id = Number(folder.id)
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
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "Triggers when created from a specific room",
        key: "id",
        label: "Room id",
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        helpText: "Triggers when created from a specific folder",
        key: "folderId",
        label: "Folder id",
        type: "integer"
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
  "Folder Created in My Documents",
  "Triggers when a folder is created in the My Documents directory.",
  [FOLDER_CREATED],
  {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when created from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
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
    folder.id = Number(folder.id)
  })
  if (bundle.inputData.folderId) {
    return trash.folders.filter((item) => item.originId === bundle.inputData.folderId)
  } else if (bundle.inputData.id) {
    return trash.folders.filter((item) => item.originId === bundle.inputData.id)
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
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        helpText: "Triggers when deleted from a specific folder (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
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
  "Folder Deleted From My Documents",
  "Triggers when a folder is deleted from the My Documents directory.",
  [FOLDER_DELETED],
  {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when deleted from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
    noun: "Folder",
    pollingFallback: performFolderDeletedInMyDocuments,
    sample: samples.folder
  }
)

const foldersInMyDocumentsList = {
  display: {
    description: "Hidden trigger to get a list of folders from the My Documents directory.",
    hidden: true,
    label: "List of Folders from My Documents"
  },
  key: "foldersInMyDocumentsList",
  noun: "Folders",
  operation: {
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
    sample: samples.file
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
  const rooms = await files.listRooms()
  rooms.folders.forEach((room) => {
    room.id = Number(room.id)
  })
  return rooms.folders.slice(0, 100)
}

const roomCreated = createWebhookTrigger(
  "roomCreated",
  "Room Created",
  "Triggers when a room is created.",
  [ROOM_CREATED],
  {
    noun: "Room",
    pollingFallback: performRoomCreated,
    sample: samples.room
  }
)

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
    room.id = Number(room.id)
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
    sample: samples.folder
  }
)

const roomsFiltered = {
  display: {
    description: "Hidden trigger to returning a list of rooms without collaboration type.",
    hidden: true,
    label: "Rooms Without Collaboration Type"
  },
  key: "roomsFiltered",
  noun: "Room",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const rooms = await performRoomCreated(z, bundle)
      return rooms.filter((room) => room.roomType !== 2)
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
      if (!user?.isAdmin && !user?.isRoomAdmin) {
        // user not have permission to invite a user to the room
        return roles
      }
      const files = new FilesService(client)
      const room = await files.roomInfo(bundle.inputData.roomId)
      const people2 = new PeopleService(client)
      var users = await people2.listUsers()
      users = users.filter((item) => item.id !== REMOVED_USER_ID)
      if (bundle.inputData.userId) {
        const foundUser = users.find((u) => u.id === bundle.inputData.userId)
        if (foundUser?.isAdmin || foundUser?.isRoomAdmin) {
          roles.push({ id: ROOM_MANAGER, name: "Room manager" })
        }
      }
      if (isPublicRoom(room.roomType)) {
        roles = roles.concat(publicRoomRoles())
      }
      if (isCustomRoom(room.roomType)) {
        roles = roles.concat(customRoomRoles())
      }
      if (isFillingFormsRoom(room.roomType)) {
        roles = roles.concat(fillingFormsRoomRoles())
      }
      if (isCollaborationRoom(room.roomType)) {
        roles = roles.concat(collaborationRoomRoles())
      }
      if (isVirtualDataRoom(room.roomType)) {
        roles = roles.concat(virtualDataRoomRoles())
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
  const filters = {
    filterType: ONLY_USERS_FILTER_TYPE
  }
  let users = await files.listUsers(bundle.inputData.id, filters)
  users = users.filter((item) => item.sharedTo.id !== REMOVED_USER_ID)
  if (bundle.inputData.active) {
    users = users.filter((item) => item.sharedTo.activationStatus === ACTIVATION_STATUS)
  }
  return users.map((item) => {
    return item.sharedTo
  })
}

const userInvited = createWebhookTrigger(
  "userInvited",
  "User Joined",
  "Triggers when a user is invited to the room.",
  [ROOM_USER_ADDED],
  {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room id",
        required: true,
        type: "integer"
      },
      {
        helpText: "Returns only those who are active",
        key: "active",
        label: "active",
        type: "boolean"
      }
    ],
    noun: "User",
    pollingFallback: performUserInvited,
    sample: user
  }
)

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
  roomArchived,
  roomCreated,
  roomsFiltered,
  shareRoles,
  userInvited
}
