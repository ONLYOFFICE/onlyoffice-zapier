//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const {
  Client,
  normalizeId,
  Progress,
  REMOVED_USER_ID,
  ROOM_MANAGER,
  stripExtension
} = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")
const { PeopleService } = require("../../docspace/people/people.js")
const { downloadFile: downloadFileHydrator } = require("./hydrators.js")
const { shareRoles } = require("./triggers.js")
const { PAGE_SIZE } = require("../pagination.js")
const { Uploader } = require("./uploader.js")
const { CONTENT_CREATOR } = require("../../docspace/client/client.js")

/**
 * @typedef {import("../../docspace/files/files.js").DownloadFileData} DownloadFileData
 * @typedef {import("../../docspace/files/files.js").ExternalLinkData} ExternalLinkData
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderContents} FolderContents
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
 * @property {boolean|string=} immediately
 */

/**
 * @typedef {Object} DeleteFolderInMyDocumentsFields
 * @property {number} folderId
 * @property {boolean|string=} immediately
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
 * Waits for the operation. Fails if the operation fails or doesn't finish in
 * time.
 * @param {ZObject} z
 * @param {Progress} progress
 * @returns {Promise<ProgressData>}
 */
async function completeOperation(z, progress) {
  const result = await progress.complete()
  if (result.error) {
    throw new z.errors.Error(result.error, "OperationFailed")
  }
  if (!result.finished) {
    throw new z.errors.Error(
      "The workspace is still processing the operation. It will finish in the background, check the result later.",
      "OperationTimeout",
      504
    )
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
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const id = normalizeId(bundle.inputData.id)
      const operation = await files.archiveRoom(id)
      const progress = new Progress(files.listOperations.bind(files), operation)
      await completeOperation(z, progress)
      const room = await files.roomInfo(id)
      room.id = normalizeId(room.id)
      return room
    },
    sample: samples.archivedRoom
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
      throw new z.errors.Error("Select a room or a folder.", "InvalidData", 400)
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
      throw new z.errors.Error("Select a room or a folder.", "InvalidData", 400)
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
    description: "Deletes a folder in a room with everything in it. Rooms have no Trash, so it can't be restored.",
    label: "Delete Folder"
  },
  key: "deleteFolder",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the folder. Use it to choose the folder from the list.",
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
      // Boolean fields may come from Zapier as strings.
      const immediately = String(bundle.inputData.immediately) === "true"
      const operation = await files.deleteFolder(normalizeId(bundle.inputData.folderId), immediately)
      const progress = new Progress(files.listOperations.bind(files), operation[0])
      return completeOperation(z, progress)
    },
    sample: samples.progress
  }
}

const deleteFolderInMyDocuments = {
  display: {
    description: "Moves a folder in the Files section to Trash or deletes it permanently.",
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
      },
      {
        default: "false",
        helpText: "Delete the folder and everything in it at once instead of moving it to Trash. " +
          "It can't be restored.",
        key: "immediately",
        label: "Delete permanently",
        type: "boolean"
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
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const file = await files.fileInfo(normalizeId(bundle.inputData.fileId))
      const hydrate = z.dehydrateFile(downloadFileHydrator, { fileId: bundle.inputData.fileId })
      return {
        contentLength: file.contentLength,
        file: hydrate,
        fileExst: file.fileExst,
        folderId: file.folderId,
        id: normalizeId(file.id),
        title: stripExtension(file.title),
        viewUrl: file.viewUrl,
        webUrl: file.webUrl
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
        dynamic: "foldersInMyDocumentsList.id.title",
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

/** @type {Record<number, string>} */
const ROLE_NAMES = {
  1: "Full access",
  10: "Editor",
  11: "Content creator",
  2: "Viewer",
  5: "Reviewer",
  6: "Commenter",
  7: "Form filler",
  9: "Room manager"
}

/**
 * Finds a room member by the exact email. The API searches by a part of the
 * name or email and also returns groups.
 * @param {FilesService} files
 * @param {number|string} roomId
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

/**
 * @param {number|string} roomId
 * @param {string} email
 * @param {UserData} member
 * @param {string} status
 * @returns {InviteGuestData}
 */
function guestData(roomId, email, member, status) {
  return {
    access: member.access,
    email,
    role: ROLE_NAMES[member.access] || "",
    roomId,
    status,
    userId: member.sharedToUser ? member.sharedToUser.id : ""
  }
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
      const roomId = normalizeId(bundle.inputData.roomId)
      const { email } = bundle.inputData
      const member = await findMember(files, roomId, email)
      if (member) {
        return guestData(roomId, email, member, "User is already a member")
      }
      const body = {
        invitations: [{
          access: bundle.inputData.access,
          email
        }],
        message: "Invitation from Zapier",
        notify: true
      }
      await files.shareRoom(roomId, body)
      const guest = await findMember(files, roomId, email)
      if (guest) {
        return guestData(roomId, email, guest, "Invited")
      }
      throw new z.errors.Error(
        "Failed to invite the guest. Check that the workspace allows guest invitations.",
        "OperationFailed"
      )
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
        throw new z.errors.Error("Failed to add the user to the room.", "OperationFailed")
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
        const uploaded = await uploader.upload(
          bodyUpload,
          (chunkData) => files.uploadChunk(session.id, chunkData)
        )
        uploaded.title = stripExtension(uploaded.title)
        if (uploaded.file) {
          uploaded.file.title = stripExtension(uploaded.file.title)
        }
        return uploaded
      }
      throw new z.errors.Error("Select a room or a folder.", "InvalidData", 400)
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

/**
 * @typedef {Object} GetFileFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string} fileId
 */

const getFile = {
  display: {
    description: "Gets a file by its ID.",
    label: "Get File"
  },
  key: "getFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the file. Use it to choose the file from the list.",
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
     * @param {Bundle<SessionAuthenticationData, GetFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const file = await files.fileInfo(normalizeId(bundle.inputData.fileId))
      file.id = normalizeId(file.id)
      file.title = stripExtension(file.title)
      return file
    },
    sample: samples.file
  }
}

/**
 * @typedef {Object} GetRoomFields
 * @property {string} id
 */

const getRoom = {
  display: {
    description: "Gets a room by its ID.",
    label: "Get Room"
  },
  key: "getRoom",
  noun: "Room",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, GetRoomFields>} bundle
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const room = await files.roomInfo(normalizeId(bundle.inputData.id))
      room.id = normalizeId(room.id)
      return room
    },
    sample: samples.room
  }
}

/**
 * @typedef {Object} DeleteFileFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string} fileId
 * @property {boolean|string=} immediately
 */

const deleteFile = {
  display: {
    description: "Deletes a file. Files in the Files section go to Trash unless deleted permanently.",
    label: "Delete File"
  },
  key: "deleteFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the file. Use it to choose the file from the list.",
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
        type: "string"
      },
      {
        dynamic: "filesList.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "string"
      },
      {
        default: "false",
        helpText: "For files in the Files section: delete the file at once instead of moving it to Trash. " +
          "Rooms have no Trash, so files in rooms are always deleted permanently.",
        key: "immediately",
        label: "Delete permanently",
        type: "boolean"
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
      // Boolean fields may come from Zapier as strings.
      const immediately = String(bundle.inputData.immediately) === "true"
      const operation = await files.deleteFile(normalizeId(bundle.inputData.fileId), immediately)
      const progress = new Progress(files.listOperations.bind(files), operation[0])
      return completeOperation(z, progress)
    },
    sample: samples.progress
  }
}

/**
 * @typedef {Object} RenameFileFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string} fileId
 * @property {string} title
 */

const renameFile = {
  display: {
    description: "Renames a file.",
    label: "Rename File"
  },
  key: "renameFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the file. Use it to choose the file from the list.",
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
        type: "string"
      },
      {
        dynamic: "filesList.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "string"
      },
      {
        helpText: "Without an extension, the file keeps its current extension.",
        key: "title",
        label: "New title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RenameFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const file = await files.renameFile(normalizeId(bundle.inputData.fileId), bundle.inputData.title)
      file.id = normalizeId(file.id)
      file.title = stripExtension(file.title)
      return file
    },
    sample: samples.file
  }
}

/**
 * @typedef {Object} RenameFolderFields
 * @property {string=} id
 * @property {string} folderId
 * @property {string} title
 */

const renameFolder = {
  display: {
    description: "Renames a folder.",
    label: "Rename Folder"
  },
  key: "renameFolder",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the folder. Use it to choose the folder from the list.",
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
      },
      {
        key: "title",
        label: "New title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RenameFolderFields>} bundle
     * @returns {Promise<FolderData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const folder = await files.renameFolder(normalizeId(bundle.inputData.folderId), bundle.inputData.title)
      folder.id = normalizeId(folder.id)
      return folder
    },
    sample: samples.folder
  }
}

/**
 * @typedef {Object} MoveFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string=} fileId
 * @property {string} destinationRoomId
 * @property {string=} destinationFolderId
 * @property {string=} conflict
 */

const MOVE_FILE_FIELDS = [
  {
    altersDynamicFields: true,
    dynamic: "roomCreated.id.title",
    helpText: "The room with the file. Use it to choose the file from the list.",
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
]

const MOVE_FOLDER_FIELDS = [
  {
    altersDynamicFields: true,
    dynamic: "roomCreated.id.title",
    helpText: "The room with the folder. Use it to choose the folder from the list.",
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
]

/**
 * @param {boolean} isFile
 * @returns {Object[]}
 */
function moveFields(isFile) {
  /** @type {Object[]} */
  const source = isFile ? MOVE_FILE_FIELDS : MOVE_FOLDER_FIELDS
  return source.concat([
    {
      altersDynamicFields: true,
      dynamic: "roomCreated.id.title",
      key: "destinationRoomId",
      label: "Destination room",
      required: true,
      type: "string"
    },
    {
      dynamic: "destinationFoldersList.id.title",
      helpText: "Leave empty to use the top level of the destination room.",
      key: "destinationFolderId",
      label: "Destination folder",
      type: "string"
    },
    {
      choices: {
        "0": "Skip",
        "1": "Overwrite",
        "2": "Keep both"
      },
      default: "2",
      helpText: "What to do if the destination already has an item with the same name.",
      key: "conflict",
      label: "If the name is taken",
      type: "string"
    }
  ])
}

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, MoveFields>} bundle
 * @param {"move"|"copy"} operation
 * @param {boolean} isFile
 * @returns {Promise<any>}
 */
async function moveOrCopy(z, bundle, operation, isFile) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const { inputData } = bundle
  const id = normalizeId(String(isFile ? inputData.fileId : inputData.folderId))
  const destFolderId = normalizeId(String(inputData.destinationFolderId || inputData.destinationRoomId))
  const operations = await files.moveOrCopy(operation, {
    conflictResolveType: Number(inputData.conflict || 2),
    destFolderId,
    fileIds: isFile ? [id] : [],
    folderIds: isFile ? [] : [id]
  })
  const progress = new Progress(files.listOperations.bind(files), operations[0])
  const result = await completeOperation(z, progress)
  // The finished operation lists the entries in their new place. For folders,
  // the list also has the destination folder.
  /** @type {any[]} */
  const entries = (isFile ? result.files : result.folders) || []
  const entry = entries.find((item) => String(item.id) !== String(destFolderId))
  if (!entry) {
    throw new z.errors.HaltedError("Nothing was changed: the destination already has an item with the same name.")
  }
  entry.id = normalizeId(entry.id)
  if (isFile) {
    entry.title = stripExtension(entry.title)
  }
  return entry
}

const moveFile = {
  display: {
    description: "Moves a file to another folder or room.",
    label: "Move File"
  },
  key: "moveFile",
  noun: "File",
  operation: {
    inputFields: moveFields(true),
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, MoveFields>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      return moveOrCopy(z, bundle, "move", true)
    },
    sample: samples.file
  }
}

const copyFile = {
  display: {
    description: "Copies a file to another folder or room.",
    label: "Copy File"
  },
  key: "copyFile",
  noun: "File",
  operation: {
    inputFields: moveFields(true),
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, MoveFields>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      return moveOrCopy(z, bundle, "copy", true)
    },
    sample: samples.file
  }
}

const moveFolder = {
  display: {
    description: "Moves a folder to another folder or room.",
    label: "Move Folder"
  },
  key: "moveFolder",
  noun: "Folder",
  operation: {
    inputFields: moveFields(false),
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, MoveFields>} bundle
     * @returns {Promise<FolderData>}
     */
    perform(z, bundle) {
      return moveOrCopy(z, bundle, "move", false)
    },
    sample: samples.folder
  }
}

const copyFolder = {
  display: {
    description: "Copies a folder to another folder or room.",
    label: "Copy Folder"
  },
  key: "copyFolder",
  noun: "Folder",
  operation: {
    inputFields: moveFields(false),
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, MoveFields>} bundle
     * @returns {Promise<FolderData>}
     */
    perform(z, bundle) {
      return moveOrCopy(z, bundle, "copy", false)
    },
    sample: samples.folder
  }
}

/**
 * @typedef {Object} UnarchiveRoomFields
 * @property {string} id
 */

const unarchiveRoom = {
  display: {
    description: "Restores a room from the Archive.",
    label: "Unarchive Room"
  },
  key: "unarchiveRoom",
  noun: "Room",
  operation: {
    inputFields: [
      {
        dynamic: "archivedRoomsList.id.title",
        key: "id",
        label: "Room",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UnarchiveRoomFields>} bundle
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const id = normalizeId(bundle.inputData.id)
      const operation = await files.unarchiveRoom(id)
      const progress = new Progress(files.listOperations.bind(files), operation)
      await completeOperation(z, progress)
      const room = await files.roomInfo(id)
      room.id = normalizeId(room.id)
      return room
    },
    sample: samples.room
  }
}

/**
 * @typedef {Object} RemoveUserFromRoomFields
 * @property {string} id
 * @property {string} userId
 */

const removeUserFromRoom = {
  display: {
    description: "Removes a user from a room.",
    label: "Remove User from Room"
  },
  key: "removeUserFromRoom",
  noun: "User",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
        type: "string"
      },
      {
        dynamic: "userInvited.id.displayName",
        helpText: "A member of the room. The room owner can't be removed.",
        key: "userId",
        label: "User",
        required: true,
        search: "searchUser.id",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RemoveUserFromRoomFields>} bundle
     * @returns {Promise<{roomId: number|string, status: string, userId: string}>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const roomId = normalizeId(bundle.inputData.id)
      const { userId } = bundle.inputData
      await files.shareRoom(roomId, {
        invitations: [{ access: 0, id: userId }],
        notify: false
      })
      // DocSpace gives the same answer when it ignores the removal, for example,
      // of the room owner. So check the members. The list of members has pages,
      // so search for the user by email.
      const people = new PeopleService(client)
      const user = await people.user(userId)
      if (await findMember(files, roomId, user.email)) {
        throw new z.errors.Error(
          "The user is still a member of the room. The room owner can't be removed.",
          "OperationFailed"
        )
      }
      return { roomId, status: "Removed", userId }
    },
    sample: samples.removedMember
  }
}

/**
 * @typedef {Object} RoomMember
 * @property {number} access
 * @property {string} displayName
 * @property {string} email
 * @property {string} id
 * @property {string} role
 * @property {string} type
 */

/**
 * @typedef {Object} GetRoomMembersFields
 * @property {string} id
 */

const getRoomMembers = {
  display: {
    description: "Gets the users and groups of a room with their roles.",
    label: "Get Room Members"
  },
  key: "getRoomMembers",
  noun: "Member",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, GetRoomMembersFields>} bundle
     * @returns {Promise<{count: number, members: RoomMember[], roomId: number|string}>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const roomId = normalizeId(bundle.inputData.id)
      /** @type {RoomMember[]} */
      const members = []
      /** @type {UserData[]} */
      let page
      let startIndex = 0
      do {
        page = await files.listUsers(roomId, { count: PAGE_SIZE, startIndex })
        page.forEach((item) => {
          const role = item.isOwner ? "Owner" : ROLE_NAMES[item.access] || ""
          const user = item.sharedToUser
          if (user && user.id !== REMOVED_USER_ID) {
            members.push({
              access: item.access,
              displayName: user.displayName,
              email: user.email,
              id: user.id,
              role,
              type: "User"
            })
          }
          const group = item.sharedToGroup
          if (group) {
            members.push({ access: item.access, displayName: group.name, email: "", id: group.id, role, type: "Group" })
          }
        })
        startIndex = startIndex + PAGE_SIZE
      } while (page.length === PAGE_SIZE)
      return { count: members.length, members, roomId }
    },
    sample: samples.roomMembers
  }
}

/**
 * @param {string[]|string} tags
 * @returns {string[]}
 */
function tagNames(tags) {
  const list = Array.isArray(tags) ? tags : [tags]
  return list.map((item) => String(item).trim()).filter((item) => item !== "")
}

/**
 * @typedef {Object} RoomTagsFields
 * @property {string} id
 * @property {string[]|string} tags
 */

const addRoomTags = {
  display: {
    description: "Adds tags to a room. Creates the tags that don't exist yet.",
    label: "Add Room Tags"
  },
  key: "addRoomTags",
  noun: "Room",
  operation: {
    inputFields: [
      {
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
        type: "string"
      },
      {
        dynamic: "tagsList.id.name",
        helpText: "Choose existing tags or enter new ones.",
        key: "tags",
        label: "Tags",
        list: true,
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RoomTagsFields>} bundle
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const names = tagNames(bundle.inputData.tags)
      if (names.length === 0) {
        throw new z.errors.Error("Enter at least one tag.", "InvalidData", 400)
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const room = await files.addRoomTags(normalizeId(bundle.inputData.id), names)
      room.id = normalizeId(room.id)
      return room
    },
    sample: samples.room
  }
}

const removeRoomTags = {
  display: {
    description: "Removes tags from a room.",
    label: "Remove Room Tags"
  },
  key: "removeRoomTags",
  noun: "Room",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
        type: "string"
      },
      {
        dynamic: "roomTagsList.id.name",
        key: "tags",
        label: "Tags",
        list: true,
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, RoomTagsFields>} bundle
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const names = tagNames(bundle.inputData.tags)
      if (names.length === 0) {
        throw new z.errors.Error("Enter at least one tag.", "InvalidData", 400)
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const room = await files.removeRoomTags(normalizeId(bundle.inputData.id), names)
      room.id = normalizeId(room.id)
      return room
    },
    sample: samples.room
  }
}

/**
 * @param {string} format
 * @returns {string}
 */
function extension(format) {
  const value = format.trim().toLowerCase()
  return value.startsWith(".") ? value : `.${value}`
}

/**
 * @typedef {Object} ConvertFileFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string} fileId
 * @property {string} format
 * @property {string=} title
 */

const convertFile = {
  display: {
    description: "Converts a file to another format. The converted file is saved next to the original.",
    label: "Convert File"
  },
  key: "convertFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the file. Use it to choose the file from the list.",
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
        type: "string"
      },
      {
        altersDynamicFields: true,
        dynamic: "filesList.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "string"
      },
      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData, ConvertFileFields>} bundle
       * @returns {Promise<Object[]>}
       */
      async function (z, bundle) {
        const field = {
          helpText: "The format to convert the file to, for example, pdf.",
          key: "format",
          label: "Format",
          required: true,
          type: "string"
        }
        const fileId = normalizeId(bundle.inputData.fileId)
        // The file can come from an earlier step. Then it isn't known yet.
        if (!fileId) {
          return [field]
        }
        const client = new Client(bundle.authData.baseUrl, z.request)
        const files = new FilesService(client)
        const file = await files.fileInfo(fileId)
        const settings = await files.settings()
        const formats = settings.extsConvertible[file.fileExst] || []
        /** @type {Record<string, string>} */
        const choices = {}
        formats.forEach((format) => {
          choices[format.slice(1)] = format.slice(1).toUpperCase()
        })
        return [{ ...field, choices }]
      },
      {
        helpText: "The title of the converted file without an extension. Leave empty to keep the title of the file.",
        key: "title",
        label: "New title",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ConvertFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const file = await files.fileInfo(normalizeId(bundle.inputData.fileId))
      const settings = await files.settings()
      const format = extension(bundle.inputData.format)
      const formats = settings.extsConvertible[file.fileExst] || []
      if (!formats.includes(format)) {
        const available = formats.length > 0 ? formats.join(", ") : "none"
        throw new z.errors.Error(
          `Can't convert ${file.fileExst} to ${format}. Available formats: ${available}.`,
          "InvalidData",
          400
        )
      }
      const title = bundle.inputData.title || stripExtension(file.title)
      const converted = await files.copyFileAs(file.id, {
        destFolderId: file.folderId,
        destTitle: `${title}${format}`
      })
      converted.id = normalizeId(converted.id)
      converted.title = stripExtension(converted.title)
      return converted
    },
    sample: samples.file
  }
}

const MAX_CONTENTS = 500

/**
 * @typedef {Object} ListedFile
 * @property {string=} contentLength
 * @property {string} created
 * @property {string} fileExst
 * @property {number} id
 * @property {string} title
 * @property {string} updated
 * @property {string} viewUrl
 * @property {string} webUrl
 */

/**
 * @typedef {Object} ListedFolder
 * @property {string} created
 * @property {number=} filesCount
 * @property {number=} foldersCount
 * @property {number} id
 * @property {string} title
 * @property {string} updated
 */

/**
 * @typedef {Object} ListedContents
 * @property {number} count
 * @property {ListedFile[]} files
 * @property {number} folderId
 * @property {ListedFolder[]} folders
 * @property {string} title
 * @property {number} total
 */

/**
 * @typedef {Object} ListFolderContentsFields
 * @property {string} id
 * @property {string=} folderId
 * @property {string|number=} limit
 */

const listFolderContents = {
  display: {
    description: "Lists the files and folders of a room or a folder.",
    label: "List Folder Contents"
  },
  key: "listFolderContents",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
        type: "string"
      },
      {
        dynamic: "foldersList.id.title",
        helpText: "Leave empty to list the top level of the room.",
        key: "folderId",
        label: "Folder",
        search: "searchFolder.id",
        type: "string"
      },
      {
        default: "100",
        helpText: `The maximum number of files and folders to return, up to ${MAX_CONTENTS}. Folders come first.`,
        key: "limit",
        label: "Limit",
        type: "integer"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ListFolderContentsFields>} bundle
     * @returns {Promise<ListedContents>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const folderId = normalizeId(bundle.inputData.folderId || bundle.inputData.id)
      const limit = Math.min(Number(bundle.inputData.limit) || PAGE_SIZE, MAX_CONTENTS)
      /** @type {FileData[]} */
      const fileList = []
      /** @type {FolderData[]} */
      const folderList = []
      /** @type {FolderContents} */
      let page
      let startIndex = 0
      do {
        const count = Math.min(PAGE_SIZE, limit - startIndex)
        page = await files.folderContents(folderId, { count, startIndex })
        fileList.push(...page.files)
        folderList.push(...page.folders)
        startIndex = fileList.length + folderList.length
      } while (startIndex < limit && startIndex < page.total && page.files.length + page.folders.length > 0)
      return {
        count: fileList.length + folderList.length,
        files: fileList.map((file) => ({
          contentLength: file.contentLength,
          created: file.created,
          fileExst: file.fileExst,
          id: normalizeId(file.id),
          title: stripExtension(file.title),
          updated: file.updated,
          viewUrl: file.viewUrl,
          webUrl: file.webUrl
        })),
        folderId: normalizeId(page.current.id),
        folders: folderList.map((folder) => ({
          created: folder.created,
          filesCount: folder.filesCount,
          foldersCount: folder.foldersCount,
          id: normalizeId(folder.id),
          title: folder.title,
          updated: folder.updated
        })),
        title: page.current.title,
        total: page.total
      }
    },
    sample: samples.folderContents
  }
}

/**
 * @typedef {Object} CreateFileWithContentFields
 * @property {string} id
 * @property {string=} folderId
 * @property {string} title
 * @property {string=} format
 * @property {string} content
 */

const createFileWithContent = {
  display: {
    description: "Creates a text or HTML file with the given content in a room.",
    label: "Create File with Content"
  },
  key: "createFileWithContent",
  noun: "File",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        key: "id",
        label: "Room",
        required: true,
        search: "searchRoom.id",
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
        helpText: "The title of the file without an extension.",
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      },
      {
        choices: {
          html: "HTML",
          txt: "Plain text"
        },
        default: "txt",
        key: "format",
        label: "Format",
        required: true,
        type: "string"
      },
      {
        key: "content",
        label: "Content",
        required: true,
        type: "text"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, CreateFileWithContentFields>} bundle
     * @returns {Promise<FileData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const isHtml = bundle.inputData.format === "html"
      const extension = isHtml ? ".html" : ".txt"
      let { title } = bundle.inputData
      // DocSpace adds the extension even if the title already has it.
      if (title.toLowerCase().endsWith(extension)) {
        title = title.slice(0, -extension.length)
      }
      const folderId = normalizeId(bundle.inputData.folderId || bundle.inputData.id)
      const file = await files.createFileWithContent(folderId, isHtml ? "html" : "text", {
        content: bundle.inputData.content,
        title
      })
      file.id = normalizeId(file.id)
      file.title = stripExtension(file.title)
      return file
    },
    sample: samples.file
  }
}

/**
 * Getting the link with `GET .../link` creates it if there is none. So without
 * `createLink`, list the links instead, and stop if there is no primary link.
 * @param {ZObject} z
 * @param {FilesService} files
 * @param {"file"|"folder"|"rooms"} entry
 * @param {number|string} id
 * @param {(() => Promise<ExternalLinkData>)=} createLink
 * @returns {Promise<ExternalLinkData>}
 */
async function primaryLink(z, files, entry, id, createLink) {
  if (createLink) {
    return await createLink()
  }
  const links = await files.listLinks(entry, id)
  const link = links.find((item) => (item.sharedLink || item.sharedTo).primary)
  if (!link) {
    const field = "Create the link if there is none"
    throw new z.errors.HaltedError(`There is no external link. Turn on "${field}" to create it.`)
  }
  return link
}

/**
 * @param {string} entry For example, "file".
 * @returns {Object}
 */
function createLinkField(entry) {
  return {
    default: "false",
    helpText: `If the ${entry} has no external link, create it with the default access of the room. ` +
      "Otherwise, the Zap stops.",
    key: "create",
    label: "Create the link if there is none",
    type: "boolean"
  }
}

/**
 * @typedef {Object} FileExternalLinkFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string} fileId
 * @property {boolean|string=} create
 */

const fileExternalLink = {
  display: {
    description: "Gets the primary external link of a file. If the file doesn't have one, creates it.",
    label: "Get File External Link"
  },
  key: "fileExternalLink",
  noun: "Link",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the file. Use it to choose the file from the list.",
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
        type: "string"
      },
      {
        dynamic: "filesList.id.title",
        key: "fileId",
        label: "File",
        required: true,
        search: "searchFile.id",
        type: "string"
      },
      createLinkField("file")
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FileExternalLinkFields>} bundle
     * @returns {Promise<ExternalLinkData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const fileId = normalizeId(bundle.inputData.fileId)
      // Boolean fields may come from Zapier as strings.
      const create = String(bundle.inputData.create) === "true"
      return await primaryLink(z, files, "file", fileId, create ? () => files.fileExternalLink(fileId) : undefined)
    },
    sample: samples.externalLink
  }
}

const LOCK_FILE_FIELDS = [
  {
    altersDynamicFields: true,
    dynamic: "roomCreated.id.title",
    helpText: "The room with the file. Use it to choose the file from the list.",
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
]

/**
 * @typedef {Object} LockFileFields
 * @property {string=} id
 * @property {string=} folderId
 * @property {string} fileId
 */

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, LockFileFields>} bundle
 * @param {boolean} lock
 * @returns {Promise<FileData>}
 */
async function setFileLock(z, bundle, lock) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const file = await files.lockFile(normalizeId(bundle.inputData.fileId), lock)
  file.id = normalizeId(file.id)
  file.title = stripExtension(file.title)
  file.locked = !!file.locked
  return file
}

const lockFile = {
  display: {
    description: "Locks a file so that only you can edit it.",
    label: "Lock File"
  },
  key: "lockFile",
  noun: "File",
  operation: {
    inputFields: LOCK_FILE_FIELDS,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, LockFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      return setFileLock(z, bundle, true)
    },
    sample: { ...samples.file, locked: true }
  }
}

const unlockFile = {
  display: {
    description: "Unlocks a locked file.",
    label: "Unlock File"
  },
  key: "unlockFile",
  noun: "File",
  operation: {
    inputFields: LOCK_FILE_FIELDS,
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, LockFileFields>} bundle
     * @returns {Promise<FileData>}
     */
    perform(z, bundle) {
      return setFileLock(z, bundle, false)
    },
    sample: { ...samples.file, locked: false }
  }
}

/**
 * @typedef {Object} FolderExternalLinkFields
 * @property {string=} id
 * @property {string} folderId
 * @property {boolean|string=} create
 */

const folderExternalLink = {
  display: {
    description: "Gets the primary external link of a folder. If the folder doesn't have one, creates it.",
    label: "Get Folder External Link"
  },
  key: "folderExternalLink",
  noun: "Link",
  operation: {
    inputFields: [
      {
        altersDynamicFields: true,
        dynamic: "roomCreated.id.title",
        helpText: "The room with the folder. Use it to choose the folder from the list.",
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
      },
      createLinkField("folder")
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, FolderExternalLinkFields>} bundle
     * @returns {Promise<ExternalLinkData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const folderId = normalizeId(bundle.inputData.folderId)
      // Boolean fields may come from Zapier as strings.
      const create = String(bundle.inputData.create) === "true"
      const createLink = create ? () => files.folderExternalLink(folderId) : undefined
      return await primaryLink(z, files, "folder", folderId, createLink)
    },
    sample: samples.externalLink
  }
}

// DocSpace creates a room from a template in the background, so check its
// status.
const ROOM_FROM_TEMPLATE_CHECKS = 40
const ROOM_FROM_TEMPLATE_DELAY = 500

/**
 * @typedef {Object} CreateRoomFromTemplateFields
 * @property {string} templateId
 * @property {string} title
 */

const createRoomFromTemplate = {
  display: {
    description: "Creates a room from a room template.",
    label: "Create Room from Template"
  },
  key: "createRoomFromTemplate",
  noun: "Room",
  operation: {
    inputFields: [
      {
        dynamic: "roomTemplatesList.id.title",
        key: "templateId",
        label: "Template",
        required: true,
        type: "string"
      },
      {
        key: "title",
        label: "Title",
        required: true,
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, CreateRoomFromTemplateFields>} bundle
     * @returns {Promise<RoomData>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      let status = await files.createRoomFromTemplate({
        templateId: Number(bundle.inputData.templateId),
        title: bundle.inputData.title
      })
      let checks = 0
      while (!status.isCompleted && !status.error && checks < ROOM_FROM_TEMPLATE_CHECKS) {
        await new Promise((resolve) => setTimeout(resolve, ROOM_FROM_TEMPLATE_DELAY))
        status = await files.roomFromTemplateStatus()
        checks = checks + 1
      }
      if (status.error) {
        throw new z.errors.Error(status.error, "OperationFailed")
      }
      if (!status.isCompleted) {
        throw new z.errors.Error("The room is still being created. Check the Rooms section later.", "Timeout", 408)
      }
      const room = await files.roomInfo(status.roomId)
      room.id = normalizeId(room.id)
      return room
    },
    sample: samples.room
  }
}

module.exports = {
  addRoomTags,
  archiveRoom,
  convertFile,
  copyFile,
  copyFolder,
  createFile,
  createFileInMyDocuments,
  createFileWithContent,
  createFolder,
  createFolderInMyDocuments,
  createRoomFromTemplate,
  deleteFile,
  deleteFolder,
  deleteFolderInMyDocuments,
  downloadFile,
  downloadFileFromMyDocuments,
  externalLink,
  fileExternalLink,
  folderExternalLink,
  getFile,
  getRoom,
  getRoomMembers,
  inviteGuest,
  listFolderContents,
  lockFile,
  moveFile,
  moveFolder,
  removeRoomTags,
  removeUserFromRoom,
  renameFile,
  renameFolder,
  roomCreate,
  shareRoom,
  unarchiveRoom,
  unlockFile,
  uploadFile,
  uploadFileToMyDocuments
}
