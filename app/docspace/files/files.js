//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Service } = require("../client/client.js")

/**
 * @typedef {import("../people/people.js").Account} Account
 * @typedef {import("../client/client.js").Filters} Filters
 * @typedef {import("../../zapier/files/uploader.js").UploadFileData} UploadFileData
 * @typedef {import("../people/people.js").User} User
 */

/**
 * @typedef {Object} ChunkData
 * @property {HttpRequestOptions["body"]} body
 * @property {HttpRequestOptions["headers"]} headers
 */

/**
 * @typedef {Object} CreateFileBody
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFileInMyDocumentsBody
 * @property {string} title
 */

/**
 * @typedef {Object} CreateFolderBody
 * @property {string} title
 */

/**
 * @typedef {Object} DownloadFileData
 * @property {number} id
 * @property {string} file
 */

/**
 * @typedef {Object} DownloadLinkData
 * @property {string} filetype
 * @property {string} token
 * @property {string} url
 */

/**
 * @typedef {Object} ExternalLinkData
 * @property {number} access
 * @property {boolean} canEditAccess
 * @property {boolean=} canEditDenyDownload
 * @property {boolean=} canEditExpirationDate
 * @property {boolean=} canEditInternal
 * @property {boolean=} canRevoke
 * @property {boolean} isLocked
 * @property {boolean} isOwner
 * @property {SharedTo=} sharedLink
 * @property {SharedTo} sharedTo Obsolete, use `sharedLink`.
 * @property {number=} subjectType
 */

/**
 * @typedef {Object} FileData
 * @property {number} rootFolderId
 * @property {number} folderId
 * @property {number=} version
 * @property {number=} versionGroup
 * @property {string=} contentLength
 * @property {number=} pureContentLength
 * @property {number=} fileStatus
 * @property {string=} comment
 * @property {number=} thumbnailStatus
 * @property {string} viewUrl
 * @property {string} webUrl
 * @property {number} fileType
 * @property {string} fileExst
 * @property {number=} fileEntryType
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {Account} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {Account} updatedBy
 * @property {number=} originId
 * @property {string=} originTitle
 * @property {number=} formFillingStatus 4 if all roles have filled out the form.
 */

/**
 * @typedef {Object} FilesList
 * @property {FileData[]} files
 */

/**
 * @typedef {Object} FilesSettings
 * @property {Record<string, string[]>} extsConvertible For each format, the
 * formats that it can be converted to.
 */

/**
 * @typedef {Object} CopyAsBody
 * @property {string} destTitle
 * @property {number|string} destFolderId
 */

/**
 * @typedef {Object} FolderData
 * @property {number} parentId
 * @property {number=} rootFolderId
 * @property {number=} filesCount
 * @property {number=} foldersCount
 * @property {number=} new
 * @property {number=} fileEntryType
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {Account} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {Account} updatedBy
 * @property {number=} originRoomId
 * @property {number=} originId
 * @property {number=} type The type of a system folder, for example, 25 for the
 * "Complete" folder of a form filling room.
 * @property {number=} originalFormId The form whose filled copies are in this
 * subfolder of the "Complete" folder.
 */

/**
 * @typedef {Object} FoldersList
 * @property {FolderData[]} folders
 */

/**
 * @typedef {Object} Invitations
 * @property {string=} email
 * @property {string=} id
 * @property {number} access
 */

/**
 * @typedef {Object} InviteGuestData
 * @property {string} status
 */

/**
 * @typedef {Object} PathParts
 * @property {number} id
 * @property {string} title
 */

/**
 * @typedef {Object} MoveBody
 * @property {number|string} destFolderId
 * @property {(number|string)[]} fileIds
 * @property {(number|string)[]} folderIds
 * @property {number} conflictResolveType 0 skips the entry, 1 replaces the
 * existing one, 2 keeps both.
 */

/**
 * @typedef {Object} ProgressData
 * @property {string} id
 * @property {number} Operation
 * @property {number=} progress
 * @property {string} error
 * @property {string} processed
 * @property {boolean} finished
 * @property {number=} status
 * @property {Object[]=} files
 * @property {Object[]=} folders
 */

/**
 * @typedef {Object} RoomCreateBody
 * @property {string} title
 * @property {number} roomType
 */

/**
 * @typedef {Object} RoomData
 * @property {number} rootFolderId
 * @property {number} parentId
 * @property {number} filesCount
 * @property {number} foldersCount
 * @property {number} new
 * @property {number} roomType
 * @property {string[]=} tags
 * @property {boolean=} private
 * @property {boolean=} indexing
 * @property {boolean=} denyDownload
 * @property {boolean=} inRoom
 * @property {number=} usedSpace
 * @property {number=} fileEntryType
 * @property {number} id
 * @property {string} title
 * @property {string} created
 * @property {Account} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {Account} updatedBy
 */

/**
 * @typedef {Object} RoleData
 * @property {number} id
 * @property {string} name
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
 * @property {boolean=} internal
 * @property {string} requestToken
 */

/**
 * @typedef {Object} ShareData
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} userName
 * @property {string} email
 * @property {number} status
 * @property {number} activationStatus
 * @property {boolean} isAdmin
 * @property {boolean} isRoomAdmin
 * @property {boolean} isLDAP
 * @property {boolean} isOwner
 * @property {boolean} isVisitor
 * @property {boolean} isCollaborator
 * @property {boolean} isSSO
 * @property {number=} quotaLimit
 * @property {number=} usedSpace
 * @property {string=} department
 * @property {number=} mobilePhoneActivationStatus
 * @property {string=} registrationDate
 * @property {string} id
 * @property {string} displayName
 * @property {string=} avatar
 * @property {string=} avatarOriginal
 * @property {string=} avatarMax
 * @property {string=} avatarMedium
 * @property {string=} avatarSmall
 * @property {string} profileUrl
 * @property {boolean=} hasAvatar
 * @property {boolean=} isAnonim
 */

/**
 * @typedef {object} ShareList
 * @property {ShareMembers[]} members
 */

/**
 * @typedef {Object} ShareMembers
 * @property {ShareData} sharedTo Obsolete, use `sharedToUser`.
 * @property {ShareData=} sharedToUser
 */

/**
 * @typedef {Object} ShareRoomBody
 * @property {Invitations[]} invitations
 * @property {boolean} notify
 * @property {string=} message
 */

/**
 * @typedef {Object} Section
 * @property {FileData[]} files
 * @property {FolderData[]} folders
 * @property {FolderData} current
 * @property {PathParts[]} pathParts
 */

/**
 * @typedef {Section[]} SectionList
 */

/**
 * @typedef {Object} Session
 * @property {string} id
 * @property {number[]} path
 * @property {string} created
 * @property {string} expired
 * @property {string} location
 * @property {number} bytes_total
 */

/**
 * @typedef {Object} SessionData
 * @property {string} fileName
 * @property {number} fileSize
 * @property {string} createOn
 */

/**
 * @typedef {Object} TrashList
 * @property {FileData[]} files
 * @property {FolderData[]} folders
 */

/**
 * @typedef {Object} UserData
 * @property {number} access
 * @property {boolean} canEditAccess
 * @property {boolean} isLocked
 * @property {boolean} isOwner
 * @property {User} sharedTo Obsolete, use `sharedToUser`.
 * @property {User=} sharedToUser
 * @property {{id: string, name: string}=} sharedToGroup
 */

/**
 * @typedef {UserData[]} UsersList
 */

class FilesService extends Service {
  /**
   * ```http
   * PUT /files/rooms/{{id}}/archive
   * ```
   * @param {number} id
   * @returns {Promise<ProgressData>}
   */
  archiveRoom(id) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/archive`)
    return this.client.request("PUT", url)
  }

  /**
   * ```http
   * PUT /files/rooms/{{id}}/tags
   * ```
   * @param {number|string} id
   * @param {string[]} names
   * @returns {Promise<RoomData>}
   */
  addRoomTags(id, names) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/tags`)
    return this.client.request("PUT", url, { names })
  }

  /**
   * ```http
   * DELETE /files/rooms/{{id}}/tags
   * ```
   * @param {number|string} id
   * @param {string[]} names
   * @returns {Promise<RoomData>}
   */
  removeRoomTags(id, names) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/tags`)
    return this.client.request("DELETE", url, { names })
  }

  /**
   * ```http
   * GET /files/tags
   * ```
   * @param {Filters} filters
   * @returns {Promise<string[]>}
   */
  listTags(filters) {
    const url = this.client.url("/files/tags", filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * PUT /files/rooms/{{id}}/unarchive
   * ```
   * @param {number|string} id
   * @returns {Promise<ProgressData>}
   */
  unarchiveRoom(id) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/unarchive`)
    return this.client.request("PUT", url, { deleteAfter: false })
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
    const url = this.client.url(`/files/${encodeURIComponent(folderId)}/file`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * POST /files/@my/file
   * ```
   * @param {CreateFileInMyDocumentsBody} body
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
    const url = this.client.url(`/files/folder/${encodeURIComponent(folderId)}`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * POST /files/rooms
   * ```
   * @param {RoomCreateBody} body
   * @returns {Promise<RoomData>}
   */
  createRoom(body) {
    const url = this.client.url("/files/rooms")
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * POST /files/{{folderId}}/session
   * ```
   * @param {number} folderId
   * @param {SessionData} body
   * @returns {Promise<Session>}
   */
  createSession(folderId, body) {
    const url = this.client.url(`/files/${encodeURIComponent(folderId)}/session`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * DELETE /files/file/{{fileId}}
   * ```
   * @param {number|string} fileId
   * @param {boolean} immediately Don't move the file to Trash.
   * @returns {Promise<ProgressData[]>}
   */
  deleteFile(fileId, immediately) {
    const url = this.client.url(`/files/file/${encodeURIComponent(fileId)}`)
    return this.client.request("DELETE", url, { deleteAfter: false, immediately })
  }

  /**
   * ```http
   * PUT /files/file/{{fileId}}
   * ```
   * @param {number|string} fileId
   * @param {string} title
   * @returns {Promise<FileData>}
   */
  renameFile(fileId, title) {
    const url = this.client.url(`/files/file/${encodeURIComponent(fileId)}`)
    return this.client.request("PUT", url, { title })
  }

  /**
   * ```http
   * PUT /files/folder/{{folderId}}
   * ```
   * @param {number|string} folderId
   * @param {string} title
   * @returns {Promise<FolderData>}
   */
  renameFolder(folderId, title) {
    const url = this.client.url(`/files/folder/${encodeURIComponent(folderId)}`)
    return this.client.request("PUT", url, { title })
  }

  /**
   * ```http
   * PUT /files/fileops/{{operation}}
   * ```
   * @param {"move"|"copy"} operation
   * @param {MoveBody} body
   * @returns {Promise<ProgressData[]>}
   */
  moveOrCopy(operation, body) {
    const url = this.client.url(`/files/fileops/${operation}`)
    return this.client.request("PUT", url, { ...body, deleteAfter: false })
  }

  /**
   * ```http
   * DELETE /files/folder/{{folderId}}
   * ```
   * @param {number} folderId
   * @returns {Promise<ProgressData[]>}
   */
  deleteFolder(folderId) {
    const url = this.client.url(`/files/folder/${encodeURIComponent(folderId)}`)
    return this.client.request("DELETE", url)
  }

  /**
   * ```http
   * GET /files/file/{{fileId}}/presigned
   * ```
   * @param {number} fileId
   * @returns {Promise<DownloadLinkData>}
   */
  downloadLink(fileId) {
    const url = this.client.url(`/files/file/${encodeURIComponent(fileId)}/presigned`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * POST /files/file/{{fileId}}/copyas
   * ```
   * @param {number|string} fileId
   * @param {CopyAsBody} body
   * @returns {Promise<FileData>}
   */
  copyFileAs(fileId, body) {
    const url = this.client.url(`/files/file/${encodeURIComponent(fileId)}/copyas`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * GET /files/settings
   * ```
   * @returns {Promise<FilesSettings>}
   */
  settings() {
    const url = this.client.url("/files/settings")
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/file/{{fileId}}
   * ```
   * @param {number|string} fileId
   * @returns {Promise<FileData>}
   */
  fileInfo(fileId) {
    const url = this.client.url(`/files/file/${encodeURIComponent(fileId)}`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/folder/{{folderId}}
   * ```
   * @param {number|string} folderId
   * @returns {Promise<FolderData>}
   */
  folderInfo(folderId) {
    const url = this.client.url(`/files/folder/${encodeURIComponent(folderId)}`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/rooms/{{id}}/link
   * ```
   * @param {number} id
   * @returns {Promise<ExternalLinkData>}
   */
  externalLink(id) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/link`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * PUT /files/rooms/{{id}}/share
   * ```
   * @param {number|string} id
   * @param {ShareRoomBody} data
   * @returns {Promise<ShareList>}
   */
  shareRoom(id, data) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/share`)
    return this.client.request("PUT", url, data)
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
    const url = this.client.url(`/files/${encodeURIComponent(folderId)}`, filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/{{id}}
   * ```
   * @param {number|string} id
   * @param {Filters} filters
   * @returns {Promise<FoldersList>}
   */
  listFolders(id, filters) {
    const url = this.client.url(`/files/${encodeURIComponent(id)}`, filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/fileops
   * ```
   * @returns {Promise<ProgressData[]>}
   */
  listOperations() {
    const url = this.client.url("/files/fileops")
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
   * GET /files/@root
   * ```
   * @returns {Promise<SectionList>}
   */
  listSections() {
    const url = this.client.url("/files/@root")
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/@trash
   * ```
   * @param {Filters} filters
   * @returns {Promise<TrashList>}
   */
  listTrash(filters) {
    const url = this.client.url("/files/@trash", filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/rooms/{{id}}/share
   * ```
   * @param {number|string} id
   * @param {Filters} filters
   * @returns {Promise<UsersList>}
   */
  listUsers(id, filters) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(id)}/share`, filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/@my
   * ```
   * @returns {Promise<Section>}
   */
  myDocumentsSection() {
    const url = this.client.url("/files/@my")
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/rooms/{{folderId}}
   * ```
   * @param {number|string} folderId
   * @returns {Promise<RoomData>}
   */
  roomInfo(folderId) {
    const url = this.client.url(`/files/rooms/${encodeURIComponent(folderId)}`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * POST /ChunkedUploader.ashx?uid={{sessionId}}
   * ```
   * @param {string} sessionId
   * @param {ChunkData} chunkData
   * @returns {Promise<UploadFileData>}
   */
  uploadChunk(sessionId, chunkData) {
    const url = `${this.client.baseUrl}/ChunkedUploader.ashx?uid=${encodeURIComponent(sessionId)}`
    return this.client.request("POST", url, chunkData.body, chunkData.headers)
  }
}

module.exports = {
  FilesService
}
