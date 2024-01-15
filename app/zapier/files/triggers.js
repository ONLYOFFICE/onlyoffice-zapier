//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const {
  ACTIVATION_STATUS,
  Client,
  customRoomRoles,
  isCustomRoom,
  isPublicRoom,
  ONLY_USERS_FILTER_TYPE,
  publicRoomRoles
} = require("../../docspase/client/client.js")
const { FilesService } = require("../../docspase/files/files.js")
const samples = require("../../docspase/files/files.samples.js")
const { user } = require("../../docspase/people/people.samples.js")

/**
 * @typedef {import("../../docspase/files/files.js").FileData} FileData
 * @typedef {import("../../docspase/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspase/files/files.js").PathParts} PathParts
 * @typedef {import("../../docspase/files/files.js").RoleData} RoleData
 * @typedef {import("../../docspase/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspase/people/people.js").User} User
 */

/**
 * @typedef {Object} FileCreatedFields
 * @property {number} folderId
 */

/**
 * @typedef {Object} FilesListFields
 * @property {number=} id
 * @property {number=} folderId
 */

/**
 * @typedef {Object} FolderCreatedFields
 * @property {number} id
 */

/**
 * @typedef {Object} FolderDeletedFields
 * @property {number} id
 */

/**
 * @typedef {object} ShareRolesFields
 * @property {number} id
 */

/**
 * @typedef {Object} UserInvitedFields
 * @property {number} id
 * @property {boolean} active
 */

const fileCreated = {
  display: {
    description: "Triggers when a file is created.",
    label: "File Created"
  },
  key: "fileCreated",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "folderId",
        label: "Folder",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileCreatedFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        filterType: "FilesOnly",
        sortBy: "DateAndTime",
        sortOrder: "descending"
      }
      const filesList = await files.listFiles(bundle.inputData.folderId, filters)
      return filesList.files
    },
    sample: samples.file
  }
}

const fileDeleted = {
  display: {
    description: "Triggers when a file is deleted.",
    label: "File Deleted"
  },
  key: "fileDeleted",
  noun: "File",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        filterType: "FilesOnly",
        sortBy: "DateAndTime",
        sortOrder: "descending"
      }
      const trash = await files.listTrash(filters)
      return trash.files
    },
    sample: samples.file
  }
}

const filesList = {
  display: {
    description: "Get files list from folder or room.",
    hidden: true,
    label: "Files List"
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
      if (!bundle.inputData.id) {
        return []
      }
      const refinedBundle = {
        ...bundle,
        inputData: {
          ...bundle.inputData,
          folderId: bundle.inputData.folderId || bundle.inputData.id
        }
      }
      return fileCreated.operation.perform(z, refinedBundle)
    },
    sample: samples.file
  }
}

const filteredSections = {
  display: {
    description: "Returns all the sections.",
    hidden: true,
    label: "Filtered Sections"
  },
  key: "filteredSections",
  noun: "Section",
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
        id: section.pathParts[0].id,
        title: section.pathParts[0].title
      }))
    },
    sample: samples.pathParts
  }
}

const folderCreated = {
  display: {
    description: "Triggers when a folder is created.",
    label: "Folder Created"
  },
  key: "folderCreated",
  noun: "Folders",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        filterType: "FoldersOnly",
        sortBy: "DateAndTime",
        sortOrder: "descending"
      }
      const folders = await files.listFolders(bundle.inputData.id, filters)
      return folders.folders
    },
    sample: samples.folder
  }
}

const folderDeleted = {
  display: {
    description: "Triggers when a folder is deleted.",
    label: "Folder Deleted"
  },
  key: "folderDeleted",
  noun: "Folders",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        helpText: "Trigger after deleted from a specific room",
        key: "id",
        label: "Room"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderDeletedFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        filterType: "FoldersOnly",
        sortBy: "DateAndTime",
        sortOrder: "descending"
      }
      const trash = await files.listTrash(filters)
      if (bundle.inputData.id) {
        return trash.folders.filter((item) => item.originRoomId === bundle.inputData.id)
      }
      return trash.folders
    },
    sample: samples.folder
  }
}

const roomCreated = {
  display: {
    description: "Triggers when a room is created.",
    label: "Room Created"
  },
  key: "roomCreated",
  noun: "Rooms",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const rooms = await files.listRooms()
      return rooms.folders
    },
    sample: samples.room
  }
}

const roomArchived = {
  display: {
    description: "Triggers when a room is archived.",
    label: "Room Archived"
  },
  key: "roomArchived",
  noun: "Rooms",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        searchArea: "Archive",
        sortBy: "DateAndTime",
        sortOrder: "descending"
      }
      const rooms = await files.listRooms(filters)
      return rooms.folders
    },
    sample: samples.folder
  }
}

const shareRoles = {
  display: {
    description: "Get roles for share by room id.",
    hidden: true,
    label: "Get Roles"
  },
  key: "shareRoles",
  noun: "Room",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ShareRolesFields>} bundle
     * @returns {Promise<RoleData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const room = await files.roomInfo(bundle.inputData.id)
      if (isPublicRoom(room.roomType)) {
        return publicRoomRoles()
      }
      if (isCustomRoom(room.roomType)) {
        return customRoomRoles()
      }
      return []
    },
    sample: samples.role
  }
}

const userInvited = {
  display: {
    description: "Triggers when a user invited to Room.",
    label: "User Joined"
  },
  key: "userInvited",
  noun: "User",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true
      },
      {
        helpText: "Return only those who are active",
        key: "active",
        label: "active",
        type: "boolean"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UserInvitedFields>} bundle
     * @returns {Promise<User[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        filterType: ONLY_USERS_FILTER_TYPE
      }
      let users = await files.listUsers(bundle.inputData.id, filters)
      if (bundle.inputData.active) {
        users = users.filter((item) => item.sharedTo.activationStatus === ACTIVATION_STATUS)
      }
      return users.map((item) => item.sharedTo)
    },
    sample: user
  }
}

module.exports = {
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
}
