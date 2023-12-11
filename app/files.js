//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Service, Progress } = require("./client.js")
const samples = require("./files.samples.js")

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
     * @param {Bundle<SessionAuthenticationData, RegularFile>} bundle
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

/**
 * @typedef {Object} CreateFileInMyDocumentsFields
 * @property {string} title
 */

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
     * @param {Bundle<SessionAuthenticationData, CreateFileInMyDocumentsFields>} bundle
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
     * @param {Bundle<SessionAuthenticationData, RoomData>} bundle
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
        choices: { 'CustomRoom': 'Custom room', 'EditingRooms': 'Editing rooms' },
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
     * @param {Bundle<SessionAuthenticationData, FileData>} bundle
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

/**
 * @typedef {Object} RegularFile
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} FileData
 * @property {number} folderId
 */

/**
 * @typedef {Object} MyDocumentsFile
 * @property {string} title
 */

/**
 * @typedef {Object} RoomsList
 * @property {RoomData[]} folders
 * @property {RoomData} current
 */

/**
 * @typedef {Object} RoomData
 * @property {number} id
 * @property {string} title
 */

/**
 * @typedef {Object} FolderOptions
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} FoldersList
 * @property {FolderData[]} folders
 */

/**
 * @typedef {Object} FolderData
 * @property {number} parentId
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {Object} createdBy
 * @property {string} createdBy.id
 * @property {string} createdBy.displayName
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {Object} updatedBy
 * @property {string} updatedBy.id
 * @property {string} updatedBy.displayName
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
 * @typedef {Object} RoomOptions
 * @property {string} title
 * @property {string} type
 */

class FilesService extends Service {
  /**
   * ```http
   * POST /files/{{folderId}}/file
   * ```
   * @param {RegularFile} file
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
   * @param {MyDocumentsFile} file
   * @returns {Promise<FileData>}
   */
  createFileInMyDocuments(file) {
    const url = this.client.url("/files/@my/file")
    return this.client.request("POST", url, file)
  }

  /**
   * ```http
   * GET /files/rooms
   * ```
   * @returns {Promise<RoomsList>}
   */
  listRooms() {
    const url = this.client.url("/files/rooms")
    return this.client.request("GET", url)
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
   * PUT /files/rooms
   * ```
   * @param {RoomData} data
   * @returns {Promise<ProgressData>}
   */
  archiveRoom(data) {
    const url = this.client.url(`/files/rooms/${data.id}/archive`)
    return this.client.request("PUT", url)
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
}

module.exports = {
  createFile,
  createFileInMyDocuments,
  roomCreated,
  createFolder,
  archiveRoom,
  roomCreate,
  folderCreated,
  FilesService
}
