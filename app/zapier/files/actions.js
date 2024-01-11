//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Progress } = require("../../docspase/client/client.js")
const { FilesService } = require("../../docspase/files/files.js")
const samples = require("../../docspase/files/files.samples.js")

/**
 * @typedef {import("../../docspase/files/files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("../../docspase/files/files.js").FileData} FileData
 * @typedef {import("../../docspase/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspase/files/files.js").ProgressData} ProgressData
 * @typedef {import("../../docspase/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 */

/**
 * @typedef {Object} ArchiveRoomFields
 * @property {number} id
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
 * @typedef {Object} CreateFolderFields
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} ExternalLinkFields
 * @property {number} id
 */

/**
 * @typedef {Object} RoomCreateFields
 * @property {string} title
 * @property {string} type
 */

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
      const operation = await files.archiveRoom(bundle.inputData.id)
      const progress = new Progress(files.listOperations.bind(files), operation)
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

module.exports = {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  externalLink,
  roomCreate
}
