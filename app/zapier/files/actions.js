//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client, Progress, ROOM_MANAGER, stripExtension } = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { PeopleService } = require("../../docspace/people/people.js")
const { downloadFile: downloadFileHydrator } = require("./hydrators.js")
const { shareRoles } = require("./triggers.js")
const { Uploader } = require("./uploader.js")
const { CONTENT_CREATOR } = require("../../docspace/client/client.js")

/**
 * @typedef {import("../../docspace/files/files.js").DownloadFileData} DownloadFileData
 * @typedef {import("../../docspace/files/files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspace/files/files.js").InviteGuestData} InviteGuestData
 * @typedef {import("../../docspace/files/files.js").ProgressData} ProgressData
 * @typedef {import("../../docspace/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspace/files/files.js").UserData} UserData
 * @typedef {import("../../docspace/files/files.js").ShareData}  _ShareData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("./triggers.js").ShareRolesFields} ShareRolesFields
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
 * @typedef {Object} InvitedRole
 * @property {Record<number, string>} choices
 * @property {string} key
 * @property {string} label
 * @property {boolean} required
 */

/**
 * @typedef {Object} InviteGuestFields
 * @property {number} roomId
 * @property {string} email
 * @property {number} access
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

/**
 * Waits for an operation and fails the action if the operation fails. If the
 * operation is still running after the wait, its current state is returned.
 * @param {ZObject} z
 * @param {Progress} progress
 * @returns {Promise<ProgressData>}
 */
async function completeOperation(z, progress) {
  const result = await progress.complete()
  if (result.error) {
    throw new z.errors.HaltedError(result.error)
  }
  return result
}

const archiveRoom = {
  display: {
    description: "Moves a room to the Archive.",
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
        required: true,
        type: "string"
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
      return completeOperation(z, progress)
    },
    sample: samples.progress
  }
}

const createFile = {
  display: {
    description: "Creates a new file in a room.",
    label: "Create File"
  },
  key: "createFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "A folder in the room. Leave empty to create the file at the top level of the room.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        default: "File from Zapier",
        helpText: "Add an extension, for example .xlsx or .pdf, to set the file type. The default is .docx.",
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
        createdFile.title = stripExtension(createdFile.title)
        return createdFile
      }
      throw new z.errors.HaltedError("Select a room or a folder.")
    },
    sample: samples.file
  }
}

const createFileInMyDocuments = {
  display: {
    description: "Creates a new file in the Files section.",
    label: "Create File in Files Section"
  },
  key: "createFileInMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to create the file at the top level of the section.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        default: "File from Zapier",
        helpText: "Add an extension, for example .xlsx or .pdf, to set the file type. The default is .docx.",
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
      createdFile.title = stripExtension(createdFile.title)
      return createdFile
    },
    sample: samples.file
  }
}

const createFolder = {
  display: {
    description: "Creates a new folder in a room.",
    label: "Create Folder"
  },
  key: "createFolder",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
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
      throw new z.errors.HaltedError("Select a room or a folder.")
    },
    sample: samples.folder
  }
}

const createFolderInMyDocuments = {
  display: {
    description: "Creates a new folder in the Files section.",
    label: "Create Folder in Files Section"
  },
  key: "createFolderInMyDocuments",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to create the folder at the top level of the section.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
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
    description: "Moves a folder in a room to Trash.",
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
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        key: "folderId",
        label: "Folder",
        required: true,
        search: "searchFolder.id",
        type: "string"
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
      return completeOperation(z, progress)
    },
    sample: samples.progress
  }
}

const deleteFolderInMyDocuments = {
  display: {
    description: "Moves a folder in the Files section to Trash.",
    label: "Delete Folder from Files Section"
  },
  key: "deleteFolderInMyDocuments",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        key: "folderId",
        label: "Folder",
        required: true,
        search: "searchFolder.id",
        type: "string"
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
    description: "Gets a file from a room to use it in later steps, for example as an email attachment.",
    label: "Download File"
  },
  key: "downloadFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        type: "string"
      },
      {
        altersDynamicFields: true,
        dynamic: "foldersList.id.title",
        helpText: "A folder to choose the file from. Leave empty to list the files at the top level of the room.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        dynamic: "filesList.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, DownloadFileFields>} bundle
     * @returns {Promise<DownloadFileData>}
     */
    async perform(z, bundle) {
      const hydrate = z.dehydrateFile(downloadFileHydrator, { fileId: bundle.inputData.fileId })
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
    description: "Gets a file from the Files section to use it in later steps, for example as an email attachment.",
    label: "Download File from Files Section"
  },
  key: "downloadFileFromMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "foldersList.id.title",
        helpText: "A folder to choose the file from. Leave empty to list the files at the top level of the section.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        dynamic: "filesListFromMyDocuments.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "string"
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
    description: "Gets the primary external link of a room. If the room doesn't have one, creates it.",
    label: "Get External Link"
  },
  key: "externalLink",
  noun: "Link",
  operation: {
    inputFields: [
      {
        dynamic: "roomsFiltered.id.title",
        key: "id",
        label: "Room",
        required: true,
        type: "string"
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

/**
 * Finds a room member by the exact email. The API searches by a part of the
 * name or email and also returns groups.
 * @param {FilesService} files
 * @param {number} roomId
 * @param {string} email
 * @returns {Promise<UserData | undefined>}
 */
async function findMember(files, roomId, email) {
  const members = await files.listUsers(roomId, { filterValue: email })
  const expected = email.toLowerCase()
  return members.find((item) => {
    const user = item.sharedToUser
    return !!user && typeof user.email === "string" && user.email.toLowerCase() === expected
  })
}

const inviteGuest = {
  display: {
    description: "Invites a person to a room by email as a guest.",
    label: "Invite Guest"
  },
  key: "inviteGuest",
  noun: "User",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "roomId",
        label: "Room",
        required: true,
        type: "string"
      },
      {
        key: "email",
        label: "Email",
        required: true
      },
      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData, ShareRolesFields>} bundle
       * @returns {Promise<InvitedRole[]>}
       */
      async function (z, bundle) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const people = new PeopleService(client)
        const user = await people.self()
        // Full admins and the owner can manage any room. Other users must be
        // the room owner, a room manager or a content creator.
        let canInvite = user.isAdmin || user.isOwner
        if (!canInvite) {
          const member = await findMember(files, bundle.inputData.roomId, user.email)
          canInvite = !!member && (
            member.isOwner ||
            member.access === ROOM_MANAGER ||
            member.access === CONTENT_CREATOR
          )
        }
        /** @type {Record<number, string>} */
        const choices = {}
        if (canInvite) {
          const roles = await shareRoles.operation.perform(z, bundle)
          for (let i = 0; i < roles.length; i = i + 1) {
            const role = roles[i]
            choices[role.id] = role.name
          }
        }
        return [{
          choices: choices,
          key: "access",
          label: "Role",
          required: true
        }]
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, InviteGuestFields>} bundle
     * @returns {Promise<InviteGuestData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const member = await findMember(files, bundle.inputData.roomId, bundle.inputData.email)
      if (member) {
        return {
          status: "User is already a member"
        }
      }
      const body = {
        invitations: [{
          access: bundle.inputData.access,
          email: bundle.inputData.email
        }],
        message: "Invitation from Zapier",
        notify: true
      }
      await files.shareRoom(bundle.inputData.roomId, body)
      const guest = await findMember(files, bundle.inputData.roomId, bundle.inputData.email)
      if (guest) {
        return {
          status: "Invited"
        }
      }
      throw new z.errors.HaltedError("Failed to invite the guest. Check that the workspace allows guest invitations.")
    },
    sample: samples.inviteGuest
  }
}

const roomCreate = {
  display: {
    description: "Creates a new room.",
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
          "1": "Form Filling Space",
          "2": "Collaboration room",
          "5": "Custom room",
          "6": "Public room",
          "8": "Virtual Data Room"
        },
        key: "roomType",
        label: "Room type",
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
        roomType: Number(bundle.inputData.roomType),
        title: bundle.inputData.title
      }
      return await files.createRoom(body)
    },
    sample: samples.room
  }
}

const shareRoom = {
  display: {
    description: "Adds a workspace user to a room with the selected role.",
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
        required: true,
        type: "string"
      },
      {
        dynamic: "userAdded.id.displayName",
        key: "userId",
        label: "User",
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
      const member = response.members.length > 0 && response.members[0].sharedToUser
      if (!member) {
        throw new z.errors.HaltedError("Failed to add the user to the room.")
      }
      return member
    },
    sample: samples.share
  }
}

const uploadFile = {
  display: {
    description: "Uploads a file to a room.",
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
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        helpText: "A file from a previous step or a public URL of the file.",
        key: "url",
        label: "File",
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
            createOn: new Date().toISOString(),
            fileName: headers.fileName,
            fileSize: headers.fileSize
          }
          const session = await files.createSession(bundle.inputData.folderId, bodySession)
          const bodyUpload = {
            data: headers.data,
            fileName: headers.fileName,
            fileSize: headers.fileSize,
            fileStash
          }
          return await uploader.upload(
            bodyUpload,
            (chunkData) => files.uploadChunk(session.id, chunkData)
          )
        } catch (error) {
          let message = "Unknown error"
          if (error instanceof Error) {
            message = error.message
          }
          throw new z.errors.HaltedError(message)
        }
      }
      throw new z.errors.HaltedError("Select a room or a folder.")
    },
    sample: samples.upload
  }
}

const uploadFileToMyDocuments = {
  display: {
    description: "Uploads a file to the Files section.",
    label: "Upload File to Files Section"
  },
  key: "uploadFileToMyDocuments",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "foldersInMyDocumentsList.id.title",
        helpText: "A folder in the Files section. Leave empty to upload the file to the top level of the section.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        helpText: "A file from a previous step or a public URL of the file.",
        key: "url",
        label: "File",
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
  inviteGuest,
  roomCreate,
  shareRoom,
  uploadFile,
  uploadFileToMyDocuments
}
