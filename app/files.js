//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Service, Progress } = require("./client.js")
const samples = require("./files.samples.js")

/**
 * @typedef {Object} ActionBy
 * @property {string} displayName
 * @property {string} id
 * @property {string} profileUrl
 */

/**
 * @typedef {Object} ArchiveRoomFields
 * @property {number} id
 */

/**
 * @typedef {Object} CreateFileBody
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFileFields
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFileInMyDocumentsFields
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFolderBody
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFolderFields
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} DeleteFileFields
 * @property {number} fileId
 */

/**
 * @typedef {Object} DeleteFilesAndFoldersBody
 * @property {number[]} folderIds
 * @property {number[]} fileIds
 * @property {boolean} deleteAfter
 * @property {boolean} immediately
 */

/**
 * @typedef {Object} ExternalLinkData
 * @property {number} access
 * @property {boolean} canEditAccess
 * @property {boolean} isLocked
 * @property {boolean} isOwner
 * @property {SharedTo} sharedTo
 */

/**
 * @typedef {Object} ExternalLinkFields
 * @property {number} id
 */

/**
 * @typedef {Object} FileCreatedFields
 * @property {number} folderId
 */

/**
 * @typedef {Object} FileData
 * @property {number} rootFolderId
 * @property {number} folderId
 * @property {string} viewUrl
 * @property {string} webUrl
 * @property {number} fileType
 * @property {string} fileExst
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {ActionBy} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {ActionBy} updatedBy
 */

/**
 * @typedef {Object} FilesList
 * @property {FileData[]} files
 */

/**
 * @typedef {Object} FolderCreatedFields
 * @property {number} id
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
 * @typedef {Object} FoldersList
 * @property {FolderData[]} folders
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
 * @typedef {Object} RoomCreateFields
 * @property {string} title
 * @property {string} type
 */

/**
 * @typedef {Object} RoomData
 * @property {number} rootFolderId
 * @property {number} parentId
 * @property {number} filesCount
 * @property {number} foldersCount
 * @property {number} new
 * @property {number} roomType
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {ActionBy} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {ActionBy} updatedBy
 */

/**
 * @typedef {Object} RoomsList
 * @property {RoomData} current
 * @property {RoomData[]} folders
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
        label: "Room",
        key: "id",
        required: true,
        dynamic: "roomCreated.id.title"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ArchiveRoomFields>} bundle
     * @returns {Promise<ProgressData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const progress = new Progress(files.archiveRoom.bind(files), bundle.inputData.id)
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
     * @param {Bundle<SessionAuthenticationData, CreateFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const body = {
        title: bundle.inputData.title
      }
      return files.createFile(bundle.inputData.folderId, body)
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
     * @param {Bundle<SessionAuthenticationData, CreateFolderFields>} bundle
     * @returns {Promise<FolderData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const body = {
        title: bundle.inputData.title
      }
      return await files.createFolder(bundle.inputData.folderId, body)
    },
    sample: samples.folder
  }
}

const deleteFile = {
  key: "deleteFile",
  noun: "File",
  display: {
    label: "Delete File",
    description: "Delete a file."
  },
  operation: {
    inputFields: [
      {
        label: "File",
        key: "fileId",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, DeleteFileFields>} bundle
     * @returns {Promise<ProgressData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const body = {
        folderIds: [],
        fileIds: [bundle.inputData.fileId],
        deleteAfter: false,
        immediately: false // Move to Trash folder
      }
      return await files.deleteFile(body) //TODO: awaiting fixes Progress
    },
    sample: samples.progress
  }
}

const externalLink = {
  key: "externalLink",
  noun: "Room",
  display: {
    label: "External Link",
    description: "Returns the primary external link of a room."
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
     * @param {Bundle<SessionAuthenticationData, ExternalLinkFields>} bundle
     * @returns {Promise<ExternalLinkData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      return await files.externalLink(bundle.inputData.id)
    },
    sample: samples.externalLink
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
     * @param {Bundle<SessionAuthenticationData, RoomCreateFields>} bundle
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
   * PUT /files/rooms/{{id}}/archive
   * ```
   * @param {number} id
   * @returns {Promise<ProgressData>}
   */
  archiveRoom(id) {
    const url = this.client.url(`/files/rooms/${id}/archive`)
    return this.client.request("PUT", url)
  }

  /**
   * ```http
   * POST /files/{{folderId}}/file
   * ```
   * @param {number } folderId
   * @param {CreateFileBody} body
   * @returns {Promise<FileData>}
   */
  createFile(folderId, body) {
    const url = this.client.url(`/files/${folderId}/file`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * POST /files/@my/file
   * ```
   * @param {CreateFileInMyDocumentsFields} body
   * @returns {Promise<FileData>}
   */
  createFileInMyDocuments(body) {
    const url = this.client.url("/files/@my/file")
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * POST /files/folder/{{folderId}}
   * ```
   * @param {number} folderId
   * @param {CreateFolderBody} body
   * @returns {Promise<FolderData>}
   */
  createFolder(folderId, body) {
    const url = this.client.url(`/files/folder/${folderId}`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * POST /files/rooms
   * ```
   * @param {RoomCreateFields} body
   * @returns {Promise<RoomData>}
   */
  createRoom(body) {
    const url = this.client.url("/files/rooms")
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * PUT /files/fileops/delete
   * ```
   * @param {DeleteFilesAndFoldersBody} body
   * @returns {Promise<>}
   */
  deleteFile(body) {
    const url = this.client.url("/files/fileops/delete")
    return this.client.request("PUT", url, body)
  }

  /**
   * ```http
   * GET /files/rooms/{{id}}/link
   * ```
   * @param {number} id
   * @returns {Promise<ExternalLinkData>}
   */
  externalLink(id) {
    const url = this.client.url(`/files/rooms/${id}/link`)
    return this.client.request("GET", url)
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

  /**
   * ```http
   * GET /files/@trash
   * ```
   * @param {Filters} filters
   * @returns {Promise<FilesList>}
   */
  listTrash(filters) {
    const url = this.client.url("/files/@trash", filters)
    return this.client.request("GET", url)
  }
}

module.exports = {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  deleteFile,
  externalLink,
  fileCreated,
  fileDeleted,
  folderCreated,
  roomArchived,
  roomCreate,
  roomCreated,
  FilesService
}
