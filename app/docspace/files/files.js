//
// (c) Copyright Ascensio System SIA 2025
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
 * @property {boolean} isLocked
 * @property {boolean} isOwner
 * @property {SharedTo} sharedTo
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
 * @property {Account} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {Account} updatedBy
 * @property {number=} originId
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
 * @property {Account} createdBy
 * @property {string} updated
 * @property {number} rootFolderType
 * @property {Account} updatedBy
 * @property {number=} originRoomId
 * @property {number=} originId
 */

/**
 * @typedef {Object} FoldersList
 * @property {FolderData[]} folders
 */

/**
 * @typedef {Object} Invitations
 * @property {string} id
 * @property {number} access
 */

/**
 * @typedef {Object} PathParts
 * @property {number} id
 * @property {string} title
 */

/**
 * DocSpace server doesn't have a generic structure for asynchronous responses.
 * Some endpoints may return the `progress` property[^1][^2][^3], while others
 * may return the `percents`[^4][^5].
 *
 * [^1]: https://github.com/ONLYOFFICE/DocSpace-server/blob/v1.1.3-server/products/ASC.Files/Core/ApiModels/ResponseDto/ConversationResultDto.cs#L32
 * [^2]: https://github.com/ONLYOFFICE/DocSpace-server/blob/v1.1.3-server/products/ASC.Files/Core/ApiModels/ResponseDto/FileOperationDto.cs#L90
 * [^3]: https://github.com/ONLYOFFICE/DocSpace-server/blob/v1.1.3-server/products/ASC.Files/Core/Services/WCFService/FileOperations/FileOperationResult.cs#L31
 * [^4]: https://github.com/ONLYOFFICE/DocSpace-server/blob/v1.1.3-server/web/ASC.Web.Api/ApiModels/RequestsDto/SmtpOperationStatusRequestsDto.cs#L31
 * [^5]: https://github.com/ONLYOFFICE/DocSpace-server/blob/v1.1.3-server/web/ASC.Web.Api/ApiModels/ResponseDto/LdapStatusDto.cs#L31
 *
 * @typedef {Object} ProgressData
 * @property {string} id
 * @property {number} operation
 * @property {number=} progress
 * @property {string} error
 * @property {string} processed
 * @property {boolean} finished
 * @property {number=} percents
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
 * @property {number} quotaLimit
 * @property {number} usedSpace
 * @property {string} id
 * @property {string} displayName
 * @property {string} profileUrl
 */

/**
 * @typedef {object} ShareList
 * @property {ShareMembers[]} members
 */

/**
 * @typedef {Object} ShareMembers
 * @property {ShareData} sharedTo
 */

/**
 * @typedef {Object} ShareRoomBody
 * @property {Invitations[]} invitations
 * @property {boolean} notify
 * @property {string} message
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
 * @property {boolean} success
 * @property {Object} data
 * @property {string} data.id
 * @property {number[]} data.path
 * @property {string} data.created
 * @property {string} data.expired
 * @property {string} data.location
 * @property {number} data.bytes_uploaded
 * @property {number} data.bytes_total
 */

/**
 * @typedef {Object} SessionData
 * @property {number} folderId
 * @property {string} FileName
 * @property {number} FileSize
 * @property {string} CreateOn
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
 * @property {User} sharedTo
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
    const url = this.client.url(`/files/folder/${folderId}`)
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
   * POST /files/{{folderId}}/upload/create_session
   * ```
   * @param {number} folderId
   * @param {SessionData} body
   * @returns {Promise<Session>}
   */
  createSession(folderId, body) {
    const url = this.client.url(`/files/${folderId}/upload/create_session`)
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * DELETE /files/folder/{{folderId}}
   * ```
   * @param {number} folderId
   * @returns {Promise<ProgressData[]>}
   */
  deleteFolder(folderId) {
    const url = this.client.url(`/files/folder/${folderId}`)
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
    const url = this.client.url(`/files/file/${fileId}/presigned`)
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
    const url = this.client.url(`/files/rooms/${id}/link`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * PUT /files/rooms/{{id}}/share
   * ```
   * @param {number} id
   * @param {ShareRoomBody} data
   * @returns {Promise<ShareList>}
   */
  shareRoom(id, data) {
    const url = this.client.url(`/files/rooms/${id}/share`)
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
   * @param {number} id
   * @param {Filters} filters
   * @returns {Promise<UsersList>}
   */
  listUsers(id, filters) {
    const url = this.client.url(`/files/rooms/${id}/share`, filters)
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
   * @param {number} folderId
   * @returns {Promise<RoomData>}
   */
  roomInfo(folderId) {
    const url = this.client.url(`/files/rooms/${folderId}`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /files/@trash
   * ```
   * @returns {Promise<Section>}
   */
  trashSection() {
    const url = this.client.url("/files/@trash")
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * POST /files/{{folderId}}/upload/create_session
   * ```
   * @param {string} sessionId
   * @param {ChunkData} chunkData
   * @returns {Promise<UploadFileData>}
   */
  uploadChunk(sessionId, chunkData) {
    const url = `${this.client.baseUrl}/ChunkedUploader.ashx?uid=${sessionId}`
    return this.client.request("POST", url, chunkData.body, chunkData.headers)
  }
}

module.exports = {
  FilesService
}
