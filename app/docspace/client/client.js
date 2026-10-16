//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

/**
 * @typedef {import("../../docspace/files/files.js").ProgressData} ProgressData
 * @typedef {import("../../docspace/files/files.js").RoleData} RoleData
 */

/**
 * @typedef {Object} Filters
 * @property {number=} count
 * @property {number=} startIndex
 * @property {string=} sortBy
 * @property {string=} sortOrder
 * @property {string=} filterValue
 * @property {string|number=} filterType
 * @property {string=} searchArea
 * @property {string=} email
 * @property {boolean=} withSubfolders
 */

const ACTIVATION_STATUS = 1
const REMOVED_USER_ID = "4A515A15-D4D6-4b8e-828E-E0586F18F3A3"

const CONTENT_CREATOR = 11
const ROOM_MANAGER = 9
const EDITOR = 10
const REVIEWER = 5
const COMMENTER = 6
const VIEWER = 2
const FORM_FILLER = 7

/**
 * @param {number} type
 * @returns {boolean}
 */
function isPublicRoom(type) {
  return type === 6
}

/**
 * @param {number} type
 * @returns {boolean}
 */
function isCustomRoom(type) {
  return type === 5
}

/**
 * @param {number} type
 * @returns {boolean}
 */
function isCollaborationRoom(type) {
  return type === 2
}

/**
 * @param {number} type
 * @returns {boolean}
 */
function isFillingFormsRoom(type) {
  return type === 1
}

/**
 * @param {number} type
 * @returns {boolean}
 */
function isVirtualDataRoom(type) {
  return type === 8
}

/**
 * @param {number} type
 * @returns {boolean}
 */
function isAiRoom(type) {
  return type === 9
}

/**
 * @returns {RoleData[]}
 */
function publicRoomRoles() {
  return [
    { id: CONTENT_CREATOR, name: "Content creator" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function customRoomRoles() {
  return [
    { id: CONTENT_CREATOR, name: "Content creator" },
    { id: EDITOR, name: "Editor" },
    { id: REVIEWER, name: "Reviewer" },
    { id: COMMENTER, name: "Commenter" },
    { id: VIEWER, name: "Viewer" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function fillingFormsRoomRoles() {
  return [
    { id: CONTENT_CREATOR, name: "Content creator" },
    { id: FORM_FILLER, name: "Form filler" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function collaborationRoomRoles() {
  return [
    { id: CONTENT_CREATOR, name: "Content creator" },
    { id: EDITOR, name: "Editor" },
    { id: VIEWER, name: "Viewer" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function virtualDataRoomRoles() {
  return [
    { id: CONTENT_CREATOR, name: "Content creator" },
    { id: EDITOR, name: "Editor" },
    { id: VIEWER, name: "Viewer" },
    { id: FORM_FILLER, name: "Form filler" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function aiRoomRoles() {
  return [
    { id: CONTENT_CREATOR, name: "Content creator" },
    { id: VIEWER, name: "Viewer" }
  ]
}

/**
 * Returns the status of an error of `z.request`. Zapier puts the status in the
 * error message.
 * @param {unknown} error
 * @returns {number | undefined}
 */
function responseStatus(error) {
  if (!(error instanceof Error)) {
    return undefined
  }
  try {
    return JSON.parse(error.message).status
  } catch {
    return undefined
  }
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isNotFoundError(error) {
  return responseStatus(error) === 404
}

/**
 * Converts numeric ids to numbers. Other ids, like user GUIDs or ids of files
 * in third-party storages, stay as is.
 * @template T
 * @param {T} id
 * @returns {T | number}
 */
function normalizeId(id) {
  if (typeof id === "string" && /^\d+$/.test(id)) {
    return Number(id)
  }
  return id
}

/**
 * Removes the extension from a file title. A title without an extension stays
 * as is.
 * @param {string} title
 * @returns {string}
 */
function stripExtension(title) {
  const index = title.lastIndexOf(".")
  if (index <= 0) {
    return title
  }
  return title.substring(0, index)
}

class Client {
  /**
   * @param {string} baseUrl
   * @param {ZRequest} zrequest
   */
  constructor(baseUrl, zrequest) {
    this.version = "/api/2.0"
    this.baseUrl = baseUrl
    this.zrequest = zrequest
  }

  /**
   * @param {string} path
   * @param {Filters} filters
   * @returns {string}
   */
  url(path, filters = {}) {
    // Here, we don't use the URL constructor to join URL parts because we
    // assume that the base URL is already normalized and it's safe to simply
    // append a string to it. Additionally, we require that the path starts with
    // a backslash, so this should be safe as well.
    const url = new URL(`${this.version}${path}`, this.baseUrl)
    const search = new URLSearchParams()

    Object.entries(filters).forEach(([
      key,
      value
    ]) => {
      if (value !== undefined) {
        search.append(key, String(value))
      }
    })

    url.search = search.toString()

    return url.toString()
  }

  /**
   * @template T
   * @param {HttpMethod} method
   * @param {string} url
   * @param {HttpRequestOptions["body"]} body
   * @param {HttpRequestOptions["headers"]} headers
   * @returns {Promise<T>}
   */
  async request(method, url, body = {}, headers = {}) {
    const response = await this.zrequest({
      body: method === "GET" ? undefined : body,
      headers,
      method,
      url
    })

    const { data } = response
    if (!data) {
      throw Error(`Unexpected response from the workspace: ${method} ${url}`)
    }

    const { status, success } = data
    if (status !== 0 && success !== true) {
      const message = data.error && data.error.message
      throw Error(message || `The workspace returned an error: ${method} ${url}`)
    }

    return data.response || data.data
  }
}

class Progress {
  /**
   * @param {() => Promise<ProgressData[]>} endpoint
   * @param {ProgressData} operation
   */
  constructor(endpoint, operation) {
    this.endpoint = endpoint
    this.operation = operation
  }

  async complete(delay = 100, limit = 20) {
    if (limit <= 0) {
      throw new Error("The limit of status checks must be greater than zero")
    }
    let progress = this.operation
    while (limit > 0) {
      const operations = await this.endpoint()
      const operation = operations.find((item) => item.id === this.operation.id)
      if (operation) {
        progress = operation
        if (progress.error || (progress.progress === 100 && progress.finished)) {
          return progress
        }
      }
      await this.wait(delay)
      limit = limit - 1
    }
    return progress
  }

  /**
   * @param {number} delay
   * @returns {Promise<void>}
   */
  async wait(delay) {
    return new Promise((resolve) => setTimeout(resolve, delay))
  }
}

class Service {
  /**
   * @param {Client} client
   */
  constructor(client) {
    this.client = client
  }
}

module.exports = {
  ACTIVATION_STATUS,
  CONTENT_CREATOR,
  Client,
  Progress,
  REMOVED_USER_ID,
  ROOM_MANAGER,
  Service,
  aiRoomRoles,
  collaborationRoomRoles,
  customRoomRoles,
  fillingFormsRoomRoles,
  isAiRoom,
  isCollaborationRoom,
  isCustomRoom,
  isFillingFormsRoom,
  isNotFoundError,
  isPublicRoom,
  isVirtualDataRoom,
  normalizeId,
  publicRoomRoles,
  responseStatus,
  stripExtension,
  virtualDataRoomRoles
}
