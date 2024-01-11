//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @typedef {import("../../docspase/files/files.js").ProgressData} ProgressData
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
   * @returns {Promise<T>}
   */
  async request(method, url, body = {}) {
    const response = await this.zrequest({ url, method, body })

    const { data } = response
    if (!data) {
      throw Error("TODO")
    }

    const { status } = data
    if (status !== 0) {
      throw Error("TODO")
    }

    return data.response
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

module.exports = { Client, Service, Progress, ACTIVATION_STATUS, ONLY_USERS_FILTER_TYPE }
