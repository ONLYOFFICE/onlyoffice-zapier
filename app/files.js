//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-nocheck

const { Client, Service } = require("./client.js")
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

const uploadFile = {
  key: "uploadFile",
  noun: "File",
  display: {
    label: "Upload File in My Documents",
    description: "Upload a file in the My Documents directory."
  },
  operation: {
    inputFields: [
      {
        label: "Title",
        key: "title",
        required: true,
        default: "File from Zapier"
      },
      {
        label: "URL",
        key: "url",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UploadFileOptions>} bundle
     * @returns {Promise<UploadResult>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const result = await files.uploadFile(bundle.inputData)
      return result.data.data
    },
    sample: samples.uploadResult
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
 * @typedef {Object} UploadFileOptions
 * @property {number} folderId
 * @property {string} title
 * @property {string} url
 */

/**
 * @typedef {Object} UploadResult
 * @property {number} id
 * @property {number} folderId
 * @property {number} version
 * @property {string} title
 * @property {Object} file
 * @property {number} file.folderId
 * @property {string} file.viewUrl
 * @property {string} file.webUrl
 * @property {number} file.fileType
 * @property {string} file.fileExst
 * @property {number} file.id
 * @property {string} file.title
 * @property {string} file.created
 * @property {Object} file.createdBy
 * @property {string} file.createdBy.id
 * @property {string} file.createdBy.displayName
 * @property {string} file.updated
 * @property {number} file.rootFolderType
 * @property {Object} file.updatedBy
 * @property {string} file.updatedBy.id
 * @property {string} file.updatedBy.displayName
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
    return this.client.request("POST", `/files/${file.folderId}/file`, file)
  }

  /**
   * ```http
   * POST /files/@my/file
   * ```
   * @param {MyDocumentsFile} file
   * @returns {Promise<FileData>}
   */
  createFileInMyDocuments(file) {
    return this.client.request("POST", "/files/@my/file", file)
  }

  /**
   * ```http
   * GET /files/rooms
   * ```
   * @returns {Promise<RoomsList>}
   */
  listRooms() {
    return this.client.request("GET", "/files/rooms")
  }

  uploadFile(options) {
    return this.client.session(options)
  }
}

module.exports = {
  createFile,
  createFileInMyDocuments,
  roomCreated,
  uploadFile,
  FilesService
}
