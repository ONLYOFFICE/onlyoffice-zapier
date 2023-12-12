//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Service, Progress } = require("./client.js")
const samples = require("./files.samples.js")

/**
 * @typedef {Object} ActionBy
 * @property {string} id
 * @property {string} displayName
 * @property {string} profileUrl
 */

/**
 * @typedef {Object} FileData
 * @property {number} folderId
 * @property {string} viewUrl
 * @property {string} webUrl
 * @property {number} fileType
 * @property {string} fileExst
 * @property {number} id
 * @property {number} rootFolderId
 * @property {string} title
 * @property {string} created
 * @property {ActionBy} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {ActionBy} updatedBy
 */

/**
 * @typedef {Object} FileOptions
 * @property {number=} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} FilesList
 * @property {FileData[]} files
 */

/**
 * @typedef {Object} FolderData
 * @property {number} parentId
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {ActionBy} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {ActionBy} updatedBy
 */

/**
 * @typedef {Object} FolderOptions
 * @property {number} folderId
 * @property {string=} title
 */

/**
 * @typedef {Object} FoldersList
 * @property {FolderData[]} folders
 */

/**
 * @typedef {Object} Link
 * @property {number} access
 * @property {SharedTo} sharedTo
 * @property {boolean} isLocked
 * @property {boolean} isOwner
 * @property {boolean} canEditAccess
 */

/**
 * @typedef {Object} ProgressData
 * @property {string} id
 * @property {number} operation
 * @property {number} progress
 * @property {string} error
 * @property {string} processed
 * @property {boolean} finished
 */

/**
 * @typedef {Object} RoomData
 * @property {number} parentId
 * @property {number} filesCount
 * @property {number} foldersCount
 * @property {number} new
 * @property {number} roomType
 * @property {number} id
 * @property {number} rootFolderId
 * @property {string} title
 * @property {string} created
 * @property {ActionBy} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {ActionBy} updatedBy
 */

/**
 * @typedef {Object} RoomOptions
 * @property {number=} id
 * @property {string} title
 * @property {string=} type
 */

/**
 * @typedef {Object} RoomsList
 * @property {RoomData[]} folders
 * @property {RoomData} current
 */

/**
 * @typedef {Object} SharedTo
 * @property {string} id
 * @property {string} title
 * @property {string} shareLink
 * @property {number} linkType
 * @property {boolean} denyDownload
 * @property {boolean} isExpired
 * @property {boolean} primary
 * @property {string} requestToken
 */

// Triggers
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
     * @param {Bundle<SessionAuthenticationData, FolderOptions>} bundle
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
        key: "folderId",
        required: true,
        dynamic: "roomCreated.id.title"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderOptions>} bundle
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
      const folders = await files.listFolders(bundle.inputData.folderId, filters)
      return folders.folders
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

// Actions
const accessRoom = {
  key: "accessRoom",
  noun: "Room",
  display: {
    label: "Access Room",
    description: "Returns the links of a room."
  },
  operation: {
    inputFields: [
      {
        label: "id",
        key: "folderId",
        required: true,
        dynamic: "roomCreated.id.folderId"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RoomOptions>} bundle
     * @returns {Promise<Link>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      return await files.accessRoom(bundle.inputData)
    },
    sample: samples.link
  }
}

const archiveRoom = {
  key: "archiveRoom",
  noun: "Room",
  display: {
    label: "Archive Room",
    description: "Archive a room."
  },
  operation: {
    inputFields: [
      {
        label: "id",
        key: "folderId",
        required: true,
        dynamic: "roomCreated.id.folderId"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RoomOptions>} bundle
     * @returns {Promise<ProgressData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const progress = new Progress(files.archiveRoom.bind(files), bundle.inputData)
      return await progress.complete()
    },
    sample: samples.progress
  }
}

const createFile = {
  key: "createFile",
  noun: "File",
  display: {
    label: "Create File",
    description: "Create a file."
  },
  operation: {
    inputFields: [
      {
        label: "Folder",
        key: "folderId",
        required: true,
        dynamic: "roomCreated.id.title"
      },
      {
        label: "Title",
        key: "title",
        required: true,
        default: "README"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileOptions>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      return files.createFile(bundle.inputData)
    },
    sample: samples.file
  }
}

const createFileInMyDocuments = {
  key: "createFileInMyDocuments",
  noun: "File",
  display: {
    label: "Create File in My Documents",
    description: "Create a file in the My Documents directory."
  },
  operation: {
    inputFields: [
      {
        label: "Title",
        key: "title",
        required: true,
        default: "README"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileOptions>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      return files.createFileInMyDocuments(bundle.inputData)
    },
    sample: samples.file
  }
}

const createFolder = {
  key: "createFolder",
  noun: "File",
  display: {
    label: "Create Folder",
    description: "Create a folder."
  },
  operation: {
    inputFields: [
      {
        label: "Folder",
        key: "folderId",
        required: true,
        dynamic: "roomCreated.id.title"
      },
      {
        label: "Title",
        key: "title",
        required: true,
        default: "Created Folder"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderOptions>} bundle
     * @returns {Promise<FolderData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      return await files.createFolder(bundle.inputData)
    },
    sample: samples.folder
  }
}

const roomCreate = {
  key: "roomCreate",
  noun: "Rooms",
  display: {
    label: "Create Room",
    description: "Create a room."
  },
  operation: {
    inputFields: [
      {
        label: "Title",
        key: "title",
        required: true,
        default: "Test room"
      },
      {
        label: "Type",
        key: "type",
        required: true,
        choices: { "CustomRoom": "Custom room", "EditingRooms": "Editing rooms" },
        default: "CustomRoom"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RoomOptions>} bundle
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      return await files.createRoom(bundle.inputData)
    },
    sample: samples.room
  }
}

class FilesService extends Service {
  /**
   * ```http
   * GET api/2.0/files/rooms/{{id}}/links
   * ```
   * @param {RoomOptions} data
   * @returns {Promise<Link>}
   */
  accessRoom(data) {
    const url = this.client.url(`/files/rooms/${data.id}/link`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * PUT /files/rooms
   * ```
   * @param {RoomOptions} data
   * @returns {Promise<ProgressData>}
   */
  archiveRoom(data) {
    const url = this.client.url(`/files/rooms/${data.id}/archive`)
    return this.client.request("PUT", url)
  }

  /**
   * ```http
   * POST /files/{{folderId}}/file
   * ```
   * @param {FileOptions} file
   * @returns {Promise<FileData>}
   */
  createFile(file) {
    const url = this.client.url(`/files/${file.folderId}/file`)
    return this.client.request("POST", url, file)
  }

  /**
   * ```http
   * POST /files/@my/file
   * ```
   * @param {FileOptions} file
   * @returns {Promise<FileData>}
   */
  createFileInMyDocuments(file) {
    const url = this.client.url("/files/@my/file")
    return this.client.request("POST", url, file)
  }

  /**
   * ```http
   * POST /files/folder/{{folderId}}
   * ```
   * @param {FolderOptions} data
   * @returns {Promise<FolderData>}
   */
  createFolder(data) {
    const url = this.client.url(`/files/folder/${data.folderId}`)
    return this.client.request("POST", url, data)
  }

  /**
   * ```http
   * POST /files/rooms
   * ```
   * @param {RoomOptions} data
   * @returns {Promise<RoomData>}
   */
  createRoom(data) {
    const url = this.client.url("/files/rooms")
    return this.client.request("POST", url, data)
  }

  /**
   * ```http
   * GET /files/{{folderId}}
   * ```
   * @param {number} folderId
   * @param {Filters} filters
   * @returns {Promise<FilesList>}
   */
  listFiles(folderId, filters) {
    const url = this.client.url(`/files/${folderId}`, filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/rooms/{{id}}
   * ```
   * @param {number} id
   * @param {Filters} filters
   * @returns {Promise<FoldersList>}
   */
  listFolders(id, filters) {
    const url = this.client.url(`/files/${id}`, filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/rooms
   * ```
   * @param {Filters=} filters
   * @returns {Promise<RoomsList>}
   */
  listRooms(filters) {
    const url = this.client.url("/files/rooms", filters)
    return this.client.request("GET", url)
  }
}

module.exports = {
  accessRoom,
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  fileCreated,
  folderCreated,
  roomArchived,
  roomCreate,
  roomCreated,
  FilesService
}
