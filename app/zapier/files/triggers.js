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
  key: "fileCreated",
  noun: "File",
  display: {
    label: "File Created",
    description: "Triggers when a file is created."
  },
  operation: {
    inputFields: [
      {
        label: "Folder",
        key: "folderId",
        required: true,
        dynamic: "roomCreated.id.title"
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
        sortBy: "DateAndTime",
        sortOrder: "descending",
        filterType: "FilesOnly"
      }
      const filesList = await files.listFiles(bundle.inputData.folderId, filters)
      return filesList.files
    },
    sample: samples.file
  }
}

const fileDeleted = {
  key: "fileDeleted",
  noun: "File",
  display: {
    label: "File Deleted",
    description: "Triggers when a file is deleted."
  },
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
        sortBy: "DateAndTime",
        sortOrder: "descending",
        filterType: "FilesOnly"
      }
      const trash = await files.listTrash(filters)
      return trash.files
    },
    sample: samples.file
  }
}

const filteredSections = {
  key: "filteredSections",
  noun: "Section",
  display: {
    label: "Filtered Sections",
    description: "Returns all the sections.",
    hidden: true
  },
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
      return sections.map(section => ({
        title: section.pathParts[0].title,
        id: section.pathParts[0].id
      }))
    },
    sample: samples.pathParts
  }
}

const folderCreated = {
  key: "folderCreated",
  noun: "Folders",
  display: {
    label: "Folder Created",
    description: "Triggers when a folder is created."
  },
  operation: {
    inputFields: [
      {
        label: "Room",
        key: "id",
        required: true,
        dynamic: "roomCreated.id.title"
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
        sortBy: "DateAndTime",
        sortOrder: "descending",
        filterType: "FoldersOnly"
      }
      const folders = await files.listFolders(bundle.inputData.id, filters)
      return folders.folders
    },
    sample: samples.folder
  }
}

const folderDeleted = {
  key: "folderDeleted",
  noun: "Folders",
  display: {
    label: "Folder Deleted",
    description: "Triggers when a folder is deleted."
  },
  operation: {
    inputFields: [
      {
        label: "Room",
        key: "id",
        dynamic: "roomCreated.id.title",
        helpText: "Trigger after deleted from a specific room"
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
        sortBy: "DateAndTime",
        sortOrder: "descending",
        filterType: "FoldersOnly"
      }
      const trash = await files.listTrash(filters)
      if (bundle.inputData.id) {
        return trash.folders.filter(item => item.originRoomId === bundle.inputData.id)
      }
      return trash.folders
    },
    sample: samples.folder
  }
}

const roomCreated = {
  key: "roomCreated",
  noun: "Rooms",
  display: {
    label: "Room Created",
    description: "Triggers when a room is created."
  },
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
  key: "roomArchived",
  noun: "Rooms",
  display: {
    label: "Room Archived",
    description: "Triggers when a room is archived."
  },
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
  key: "shareRoles",
  noun: "Room",
  display: {
    label: "Get Roles",
    description: "Get roles for share by room id.",
    hidden: true
  },
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
  key: "userInvited",
  noun: "User",
  display: {
    label: "User Joined",
    description: "Triggers when a user invited to Room."
  },
  operation: {
    inputFields: [
      {
        label: "Room",
        key: "id",
        required: true,
        dynamic: "roomCreated.id.title"
      },
      {
        label: "active",
        key: "active",
        type: "boolean",
        helpText: "Return only those who are active"
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
  filteredSections,
  folderCreated,
  folderDeleted,
  roomArchived,
  roomCreated,
  shareRoles,
  userInvited
}
