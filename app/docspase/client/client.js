//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @typedef {import("../../docspase/files/files.js").ProgressData} ProgressData
 * @typedef {import("../../docspase/files/files.js").RoleData} RoleData
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
 * @returns {RoleData[]}
 */
function publicRoomRoles() {
  return [
    { id: 2, name: "Viewer" },
    { id: 10, name: "Editor" }
  ]
}

/**
 * @returns {RoleData[]}
 */
function customRoomRoles() {
  return [
    { id: 9, name: "Room admin" },
    { id: 11, name: "Power user" }
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
    const response = await this.zrequest({ url, method, body, headers })

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
      const operation = operations.find(item => item.id === this.operation.id)
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
      limit--
    }
    return progress
  }

  /**
   * @param {number} delay
   */
  async wait(delay) {
    return new Promise(resolve => setTimeout(resolve, delay))
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
  customRoomRoles,
  isCustomRoom,
  isPublicRoom,
  ONLY_USERS_FILTER_TYPE,
  Progress,
  publicRoomRoles,
  Service
}
