//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Progress } = require("../../docspase/client/client.js")
const { FilesService } = require("../../docspase/files/files.js")
const samples = require("../../docspase/files/files.samples.js")
const { stashFile } = require("./hydrators.js")
const { Uploader } = require("./uploader.js")

/**
 * @typedef {import("../../docspase/files/files.js").ChunkData} ChunkData
 * @typedef {import("../../docspase/files/files.js").DownloadFileData} DownloadFileData
 * @typedef {import("../../docspase/files/files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("../../docspase/files/files.js").FileData} FileData
 * @typedef {import("../../docspase/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspase/files/files.js").ProgressData} ProgressData
 * @typedef {import("../../docspase/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspase/files/files.js").ShareData}  _ShareData
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("./uploader.js").UploadFileData} UploadFileData
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
 * @typedef {Object} DeleteFolderFields
 * @property {number} folderId
 * @property {number} id
 */

/**
 * @typedef {Object} DownloadFileFields
 * @property {number} fileId
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

/**
 * @typedef {Object} ShareRoomFields
 * @property {number} roomId
 * @property {string} userId
 * @property {number} access
 */

/**
 * @typedef {Object} UploadFileFields
 * @property {number=} id
 * @property {number} folderId
 * @property {string} url
 */

const archiveRoom = {
  display: {
    description: "Archive a room.",
    label: "Archive Room"
  },
  key: "archiveRoom",
  noun: "Room",
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
  display: {
    description: "Create a file.",
    label: "Create File"
  },
  key: "createFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "folderId",
        label: "Folder",
        required: true
      },
      {
        default: "README",
        key: "title",
        label: "Title",
        required: true
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
  display: {
    description: "Create a file in the My Documents directory.",
    label: "Create File in My Documents"
  },
  key: "createFileInMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        default: "README",
        key: "title",
        label: "Title",
        required: true
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
  display: {
    description: "Create a folder.",
    label: "Create Folder"
  },
  key: "createFolder",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "folderId",
        label: "Folder",
        required: true
      },
      {
        default: "Created Folder",
        key: "title",
        label: "Title",
        required: true
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

const deleteFolder = {
  display: {
    description: "Delete a folder.",
    label: "Delete Folder"
  },
  key: "deleteFolder",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true
      },
      {
        dynamic: "folderCreated.id.title",
        key: "folderId",
        label: "Folder",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, DeleteFolderFields>} bundle
     * @returns {Promise<ProgressData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const operation = await files.deleteFolder(bundle.inputData.folderId)
      const progress = new Progress(files.listOperations.bind(files), operation[0])
      return await progress.complete()
    },
    sample: samples.progress
  }
}

const downloadFile = {
  display: {
    description: "Returns a hydrated link to download a file.",
    label: "Download File"
  },
  key: "downloadFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room where the file is located",
        key: "id",
        label: "Room",
        required: true
      },
      {
        altersDynamicFields: true,
        dynamic: "folderCreated.id.title",
        helpText: "The folder where the file is located (optional)",
        key: "folderId",
        label: "Folder"
      },
      {
        dynamic: "hiddenFileCreated.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, DownloadFileFields>} bundle
     * @returns {Promise<DownloadFileData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const result = await files.downloadLink(bundle.inputData.fileId)
      const hydrate = await z.dehydrateFile(stashFile, { url: result.url })
      return {
        file: hydrate,
        id: bundle.inputData.fileId
      }
    },
    sample: samples.hydratedFile
  }
}

const externalLink = {
  display: {
    description: "Returns the primary external link of a room.",
    label: "External Link"
  },
  key: "externalLink",
  noun: "Room",
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
  display: {
    description: "Create a room.",
    label: "Create Room"
  },
  key: "roomCreate",
  noun: "Rooms",
  operation: {
    inputFields: [
      {
        default: "Test room",
        key: "title",
        label: "Title",
        required: true
      },
      {
        choices: { "CustomRoom": "Custom room", "EditingRooms": "Editing rooms" },
        default: "CustomRoom",
        key: "type",
        label: "Type",
        required: true
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

const shareRoom = {
  display: {
    description: "Share a room with a user.",
    label: "Share Room"
  },
  key: "shareRoom",
  noun: "Room",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "roomId",
        label: "Room",
        required: true
      },
      {
        dynamic: "userAdded.id.displayName",
        key: "userId",
        label: "User",
        required: true
      },
      {
        dynamic: "shareRoles.id.name",
        key: "access",
        label: "Role",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ShareRoomFields>} bundle
     * @returns {Promise<_ShareData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const body = {
        invitations: [{
          access: bundle.inputData.access,
          id: bundle.inputData.userId
        }],
        message: "Invitation from Zapier",
        notify: true
      }
      const response = await files.shareRoom(bundle.inputData.roomId, body)
      if (response.members.length <= 0) {
        throw new z.errors.HaltedError("Failed to invite user")
      }
      return response.members[0].sharedTo
    },
    sample: samples.share
  }
}

const uploadFile = {
  display: {
    description: "Upload a file.",
    label: "Upload File"
  },
  key: "uploadFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true
      },
      {
        dynamic: "folderCreated.id.title",
        key: "folderId",
        label: "Folder"
      },
      {
        helpText: "Download file via direct link or hydrate file",
        key: "url",
        label: "URL or File",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UploadFileFields>} bundle
     * @returns {Promise<UploadFileData>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId && bundle.inputData.id) {
        bundle.inputData.folderId = bundle.inputData.id
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const uploader = new Uploader(z)
      try {
        const fileStash = await uploader.stash(bundle.inputData.url)
        const headers = await uploader.headers(fileStash)
        const bodySession = {
          CreateOn: new Date().toISOString(),
          FileName: headers.fileName,
          FileSize: headers.fileSize,
          folderId: bundle.inputData.folderId
        }
        const session = await files.createSession(bundle.inputData.folderId, bodySession)
        const bodyUpload = {
          fileName: headers.fileName,
          fileSize: headers.fileSize,
          fileStash
        }
        return await uploader.upload(
          bodyUpload,
          (chunkData) => files.uploadChunk(session.data.id, chunkData)
        )
      } catch (error) {
        let message = "Unknown error"
        if (error instanceof Error) {
          message = error.message
        }
        throw new z.errors.HaltedError(message)
      }
    },
    sample: samples.upload
  }
}

module.exports = {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  deleteFolder,
  downloadFile,
  externalLink,
  roomCreate,
  shareRoom,
  uploadFile
}
