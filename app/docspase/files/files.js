//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Service } = require("../client/client.js")

/**
 * @typedef {import("../client/client.js").Filters} Filters
 */

/**
 * @typedef {Object} ActionBy
 * @property {string} displayName
 * @property {string} id
 * @property {string} profileUrl
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
 * @typedef {Object} PathParts
 * @property {number} id
 * @property {string} title
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
 * @typedef {Object} RoomCreateBody
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
   * @returns {Promise<FilesList>}
   */
  listTrash(filters) {
    const url = this.client.url("/files/@trash", filters)
    return this.client.request("GET", url)
  }
}

module.exports = {
  FilesService
}
