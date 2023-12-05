//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

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
   * @template T
   * @param {HttpMethod} method
   * @param {string} path
   * @param {HttpRequestOptions["body"]} body
   * @returns {Promise<T>}
   */
  async request(method, path, body = {}) {
    // Here, we don't use the URL constructor to join URL parts because we
    // assume that the base URL is already normalized and it's safe to simply
    // append a string to it. Additionally, we require that the path starts with
    // a backslash, so this should be safe as well.
    const url = `${this.baseUrl}${this.version}${path}`
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
 * @typedef {Object} InternalProgress
 * @property {string} error
 * @property {number=} progress
 * @property {number=} percents
 */

/**
 * @template {(...args: Parameters<T>) => PromiseLike<Awaited<ReturnType<T>> & InternalProgress>} T
 */
class Progress {
  /**
   * @param {T} endpoint
   * @param {Parameters<T>} options
   */
  constructor(endpoint, ...options) {
    this.endpoint = endpoint
    this.options = options
  }

  /**
   * @param {number} delay
   * @param {number} limit
   * @returns {Promise<ReturnType<T>>}
   */
  async complete(delay = 100, limit = 20) {
    if (limit <= 0) {
      throw new Error("todo")
    }
    const iterator = this[Symbol.asyncIterator]()
    return gather(iterator, delay, limit)

    /**
     * todo: replace the iterator type with the AsyncIterableIterator interface.
     * @param {ReturnType<Progress<T>[typeof Symbol.asyncIterator]>} iterator
     * @param {number} delay
     * @param {number} limit
     * @returns {Promise<ReturnType<T>>}
     */
    async function gather(iterator, delay, limit) {
      limit -= 1

      const result = await iterator.next()
      const response = result.value

      if (!!response.error || limit === 0) {
        return response
      }

      if (Object.hasOwn(response, "progress")) {
        if (response.progress === 100) {
          return response
        }
      }

      if (Object.hasOwn(response, "percents")) {
        if (response.percents === 100) {
          return response
        }
      }

      wait(delay)
      return gather(iterator, delay, limit)
    }

    /**
     * @param {number} delay
     * @returns {Promise<void>}
     */
    async function wait(delay) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  [Symbol.asyncIterator]() {
    return {
      next: async () => {
        const value = await this.endpoint(...this.options)
        return {
          value,
          done: false
        }
      }
    }
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

module.exports = { Client, Service, Progress }
