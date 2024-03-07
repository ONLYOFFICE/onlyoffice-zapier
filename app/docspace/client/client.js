//
// (c) Copyright Ascensio System SIA 2023
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
 * @property {string=} filterBy
 * @property {string=} filterOp
 * @property {string=} filterValue
 * @property {string|number=} filterType
 * @property {string=} searchArea
 */

const ACTIVATION_STATUS = 1
const ONLY_USERS_FILTER_TYPE = 0

/**
 * @param {number} type
 * @returns {boolean}
 */
function isPublicRoom(type) {
  return type === 5
}

/**
 * @param {number} type
 * @returns {boolean}
 */
function isCustomRoom(type) {
  return type === 6
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
function isBasicFormRoom(type) {
  return type === 1
}

/**
 * @returns {RoleData[]}
 */
function customRoomRoles() {
  return [
    { id: 10, name: "Editor" },
    { id: 7, name: "Form filler" },
    { id: 5, name: "Reviewer" },
    { id: 6, name: "Commenter" },
    { id: 2, name: "Viewer" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function basicFormRoomRoles() {
  return [
    { id: 2, name: "Viewer" },
    { id: 7, name: "Form filler" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function collaborationRoomRoles() {
  return [
    { id: 10, name: "Editor" },
    { id: 2, name: "Viewer" }
  ]
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
    const response = await this.zrequest({ body, headers, method, url })

    const { data } = response
    if (!data) {
      throw Error("TODO")
    }

    const { status, success } = data
    if (status !== 0 && success !== true) {
      throw Error("TODO")
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
      throw new Error("todo")
    }
    let progress = this.operation
    while (limit > 0) {
      const operations = await this.endpoint()
      const operation = operations.find((item) => item.id === this.operation.id)
      if (operation) {
        progress = operation
        if (!!progress.error || limit === 0) {
          return progress
        }

        if (Object.hasOwn(progress, "progress")) {
          if (progress.progress === 100) {
            return progress
          }
        }

        if (Object.hasOwn(progress, "percents")) {
          if (progress.percents === 100) {
            return progress
          }
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
  Client,
  ONLY_USERS_FILTER_TYPE,
  Progress,
  Service,
  basicFormRoomRoles,
  collaborationRoomRoles,
  customRoomRoles,
  isBasicFormRoom,
  isCollaborationRoom,
  isCustomRoom,
  isPublicRoom
}
