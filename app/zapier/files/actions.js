//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Progress } = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { stashFile } = require("./hydrators.js")
const { Uploader } = require("./uploader.js")

/**
 * @typedef {import("../../docspace/files/files.js").ChunkData} ChunkData
 * @typedef {import("../../docspace/files/files.js").DownloadFileData} DownloadFileData
 * @typedef {import("../../docspace/files/files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspace/files/files.js").ProgressData} ProgressData
 * @typedef {import("../../docspace/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspace/files/files.js").ShareData}  _ShareData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("./uploader.js").UploadFileData} UploadFileData
 */

/**
 * @typedef {Object} ArchiveRoomFields
 * @property {number} id
 */

/**
 * @typedef {Object} CreateFileFields
 * @property {number=} id
 * @property {number=} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFileInMyDocumentsFields
 * @property {number=} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFolderFields
 * @property {number=} id
 * @property {number=} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFolderInMyDocumentsFields
 * @property {number=} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} DeleteFolderFields
 * @property {number} folderId
 * @property {number=} id
 */

/**
 * @typedef {Object} DeleteFolderInMyDocumentsFields
 * @property {number} folderId
 */

/**
 * @typedef {Object} DownloadFileFields
 * @property {number} fileId
 */

/**
 * @typedef {Object} DownloadFileFromMyDocumentsFields
 * @property {number} fileId
 */

/**
 * @typedef {Object} ExternalLinkFields
 * @property {number} id
 */

/**
 * @typedef {Object} RoomCreateFields
 * @property {string} title
 * @property {string} roomType
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
 * @property {number=} folderId
 * @property {string} url
 */

/**
 * @typedef {Object} UploadFileToMyDocumentsFields
 * @property {number=} folderId
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
        label: "Room id",
        required: true,
        type: "integer"
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
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room where the file will be created",
        key: "id",
        label: "Room id",
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        helpText: "The folder where the file will be created (optional)",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        default: "File from Zapier",
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, CreateFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        bundle.inputData.folderId = bundle.inputData.id
      }
      if (bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const body = {
          title: bundle.inputData.title
        }
        const createdFile = await files.createFile(bundle.inputData.folderId, body)
        createdFile.title = createdFile.title.substring(0, createdFile.title.lastIndexOf("."))
        return createdFile
      }
      throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
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
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "The folder where the file will be created (optional)",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        default: "README",
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, CreateFileInMyDocumentsFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      if (bundle.inputData.folderId) {
        return createFile.operation.perform(z, bundle)
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const createdFile = await files.createFileInMyDocuments(bundle.inputData)
      createdFile.title = createdFile.title.substring(0, createdFile.title.lastIndexOf("."))
      return createdFile
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
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room id",
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        default: "Folder from Zapier",
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, CreateFolderFields>} bundle
     * @returns {Promise<FolderData>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        bundle.inputData.folderId = bundle.inputData.id
      }
      if (bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const body = {
          title: bundle.inputData.title
        }
        return await files.createFolder(bundle.inputData.folderId, body)
      }
      throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
    },
    sample: samples.folder
  }
}

const createFolderInMyDocuments = {
  display: {
    description: "Create a folder in the My Documents directory.",
    label: "Create Folder in My Documents"
  },
  key: "createFolderInMyDocuments",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "The folder where the folder will be created (optional)",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        default: "Folder from Zapier",
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, CreateFolderInMyDocumentsFields>} bundle
     * @returns {Promise<FolderData>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return createFolder.operation.perform(z, bundle)
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
        label: "Room id",
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        key: "folderId",
        label: "Folder id",
        required: true,
        search: "searchFolder.id",
        type: "integer"
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

const deleteFolderInMyDocuments = {
  display: {
    description: "Delete a folder from the My Documents directory.",
    label: "Delete Folder From My Documents"
  },
  key: "deleteFolderInMyDocuments",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        key: "folderId",
        label: "Folder id",
        required: true,
        search: "searchFolder.id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, DeleteFolderInMyDocumentsFields>} bundle
     * @returns {Promise<ProgressData>}
     */
    async perform(z, bundle) {
      return deleteFolder.operation.perform(z, bundle)
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
        label: "Room id",
        type: "integer"
      },
      {
        altersDynamicFields: true,
        dynamic: "folderCreated.id.title",
        helpText: "The folder where the file is located (optional)",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        dynamic: "filesList.id.title",
        key: "fileId",
        label: "File id",
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

const downloadFileFromMyDocuments = {
  display: {
    description: "Returns a hydrated link to download a file from the My Documents directory.",
    label: "Download File From My Documents"
  },
  key: "downloadFileFromMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "folderCreated.id.title",
        helpText: "The folder where the file is located (optional)",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        dynamic: "filesListFromMyDocuments.id.title",
        key: "fileId",
        label: "File id",
        required: true,
        search: "searchFile.id",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, DownloadFileFromMyDocumentsFields>} bundle
     * @returns {Promise<DownloadFileData>}
     */
    async perform(z, bundle) {
      return downloadFile.operation.perform(z, bundle)
    },
    sample: samples.hydratedFile
  }
}

const externalLink = {
  display: {
    description: "Returns the primary external link of a room.",
    label: "Get External Link"
  },
  key: "externalLink",
  noun: "Link",
  operation: {
    inputFields: [
      {
        dynamic: "roomsFiltered.id.title",
        key: "id",
        label: "Room id",
        required: true,
        type: "integer"
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
  noun: "Room",
  operation: {
    inputFields: [
      {
        default: "Room from Zapier",
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      },
      {
        choices: {
          "1": "Basic form room",
          "2": "Collaboration room",
          "5": "Custom room",
          "6": "Public room"
        },
        key: "roomType",
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
      const body = {
        roomType: parseInt(bundle.inputData.roomType, 10),
        title: bundle.inputData.title
      }
      return await files.createRoom(body)
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
        label: "Room id",
        required: true,
        type: "integer"
      },
      {
        dynamic: "userAdded.id.displayName",
        key: "userId",
        label: "User id",
        required: true,
        type: "string"
      },
      {
        dynamic: "shareRoles.id.name",
        key: "access",
        label: "Role",
        required: true,
        type: "integer"
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
        label: "Room id",
        type: "integer"
      },
      {
        dynamic: "folderCreated.id.title",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        helpText: "Download the file via direct link or hydrate the file",
        key: "url",
        label: "URL or File",
        required: true,
        type: "file"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UploadFileFields>} bundle
     * @returns {Promise<UploadFileData>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        bundle.inputData.folderId = bundle.inputData.id
      }
      if (bundle.inputData.folderId) {
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
      }
      throw new z.errors.HaltedError("Check that all Zap fields are entered correctly")
    },
    sample: samples.upload
  }
}

const uploadFileToMyDocuments = {
  display: {
    description: "Upload a file to the My Documents directory.",
    label: "Upload File to My Documents"
  },
  key: "uploadFileToMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "The folder where the file will be uploaded (optional)",
        key: "folderId",
        label: "Folder id",
        search: "searchFolder.id",
        type: "integer"
      },
      {
        helpText: "Download the file via direct link or hydrate the file",
        key: "url",
        label: "URL or File",
        required: true,
        type: "file"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UploadFileToMyDocumentsFields>} bundle
     * @returns {Promise<UploadFileData>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.folderId) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const folderId = await files.myDocumentsSection()
        bundle.inputData.folderId = folderId.pathParts[0].id
      }
      return uploadFile.operation.perform(z, bundle)
    },
    sample: samples.upload
  }
}

module.exports = {
  archiveRoom,
  createFile,
  createFileInMyDocuments,
  createFolder,
  createFolderInMyDocuments,
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  roomCreate,
  shareRoom,
  uploadFile,
  uploadFileToMyDocuments
}
