//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const {
  ACTIVATION_STATUS,
  basicFormRoomRoles,
  Client,
  collaborationRoomRoles,
  customRoomRoles,
  isBasicFormRoom,
  isCollaborationRoom,
  isCustomRoom,
  ONLY_USERS_FILTER_TYPE
} = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { user } = require("../../docspace/people/people.samples.js")
const { userAdded } = require("../people/triggers.js")

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

const fileCreated = {
  display: {
    description: "Triggers when a file is created in a room or folder.",
    label: "File Created"
  },
  key: "fileCreated",
  noun: "File",
  operation: {
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
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileCreatedFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
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
        })
        return filesList.files
      }
      throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
    },
    sample: samples.file
  }
}

const fileCreatedInMyDocuments = {
  display: {
    description: "Triggers when a file is created in the My Documents directory.",
    label: "File Created in My Documents"
  },
  key: "fileCreatedInMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when created from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileCreatedInMyDocumentsFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return fileCreated.operation.perform(z, bundle)
    },
    sample: samples.file
  }
}

const fileDeleted = {
  display: {
    description: "Triggers when a file is deleted (optionally from a room or folder).",
    label: "File Deleted"
  },
  key: "fileDeleted",
  noun: "File",
  operation: {
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
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileDeletedFields>} bundle
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
      trash.files.forEach((file) => {
        file.title = file.title.substring(0, file.title.lastIndexOf("."))
      })
      if (bundle.inputData.id || bundle.inputData.folderId) {
        if (!bundle.inputData.folderId) {
          bundle.inputData.folderId = bundle.inputData.id
        }
        return trash.files.filter((item) => item.originId === bundle.inputData.folderId)
      }
      return trash.files
    },
    sample: samples.file
  }
}

const fileDeletedInMyDocuments = {
  display: {
    description: "Triggers when a file is deleted from the My Documents directory.",
    label: "File Deleted From My Documents"
  },
  key: "fileDeletedInMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when deleted from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileDeletedInMyDocumentsFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return fileDeleted.operation.perform(z, bundle)
    },
    sample: samples.file
  }
}

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
      return fileCreated.operation.perform(z, bundle)
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
      return fileCreated.operation.perform(z, bundle)
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
        id: section.pathParts[0].id,
        title: section.pathParts[0].title
      }))
    },
    sample: samples.pathParts
  }
}

const folderCreated = {
  display: {
    description: "Triggers when a folder is created in a room or folder.",
    label: "Folder Created"
  },
  key: "folderCreated",
  noun: "Folder",
  operation: {
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
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
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
        return folders.folders
      }
      throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
    },
    sample: samples.folder
  }
}

const folderCreatedInMyDocuments = {
  display: {
    description: "Triggers when a folder is created in the My Documents directory.",
    label: "Folder Created in My Documents"
  },
  key: "folderCreatedInMyDocuments",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when created from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderCreatedInMyDocumentsFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return folderCreated.operation.perform(z, bundle)
    },
    sample: samples.folder
  }
}

const folderDeleted = {
  display: {
    description: "Triggers when a folder is deleted (optionally from a room or folder).",
    label: "Folder Deleted"
  },
  key: "folderDeleted",
  noun: "Folder",
  operation: {
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
      if (bundle.inputData.folderId) {
        return trash.folders.filter((item) => item.originId === bundle.inputData.folderId)
      } else if (bundle.inputData.id) {
        return trash.folders.filter((item) => item.originId === bundle.inputData.id)
      }
      return trash.folders
    },
    sample: samples.folder
  }
}

const folderDeletedInMyDocuments = {
  display: {
    description: "Triggers when a folder is deleted from the My Documents directory.",
    label: "Folder Deleted From My Documents"
  },
  key: "folderDeletedInMyDocuments",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "Triggers when deleted from a specific folder of the My Documents directory (optional)",
        key: "folderId",
        label: "Folder id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderDeletedInMyDocumentsFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return folderDeleted.operation.perform(z, bundle)
    },
    sample: samples.folder
  }
}

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
      return await folderCreated.operation.perform(z, refinedBundle)
    },
    sample: samples.file
  }
}

const roomCreated = {
  display: {
    description: "Triggers when a room is created.",
    label: "Room Created"
  },
  key: "roomCreated",
  noun: "Room",
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
  noun: "Room",
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
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const room = await files.roomInfo(bundle.inputData.roomId)
      const users = await userAdded.operation.perform(z, bundle)
      var roles = []
      if (bundle.inputData.userId) {
        const user = users.find((user) => user.id === bundle.inputData.userId)
        if (user?.isAdmin || user?.isRoomAdmin || user?.isCollaborator) {
          roles.push(
            { id: 9, name: "Room admin" },
            { id: 11, name: "Power user" }
          )
        }
      }
      if (isCustomRoom(room.roomType)) {
        roles = roles.concat(customRoomRoles())
      }
      if (isBasicFormRoom(room.roomType)) {
        roles = roles.concat(basicFormRoomRoles())
      }
      if (isCollaborationRoom(room.roomType)) {
        roles = roles.concat(collaborationRoomRoles())
      }
      return roles
    },
    sample: samples.role
  }
}

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
        type: "integer"
      },
      {
        helpText: "Returns only those who are active",
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
  shareRoles,
  userInvited
}
