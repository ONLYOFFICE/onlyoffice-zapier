//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const FormData = require("form-data")
const contentDisposition = require("content-disposition")

/**
 * @typedef {Object} ErrorData
 * @property {string} message
 * @property {string} stack
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
   * @property {string=} filterType
   * @property {string=} searchArea
   */

/**
 * @typedef {Object} Headers
 * @property {number} size
 * @property {string} name
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
      throw Error("TODO") //TODO: for Error Handling need ZObject in Client class
    }

    const { status, success } = data
    if (status !== 0 && success !== true) {
      throw Error("TODO")
    }

    return data.response || data.data
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

/**
 * @extends Client
 */
class Upload extends Client {
  /**
   * @param {string} baseUrl
   * @param {ZObject} z
   */
  constructor(baseUrl, z) {
    super(baseUrl, z.request)
    this.z = z
  }

  /**
   * @param {UploadFileFields} options
   * @returns {Promise<UploadFileData>}
   * @throws {ErrorData}
   */
  async start(options) {
    try {
      const zapierUrl = options.url.startsWith("https://zapier.com/engine/hydrate/") ? options.url : await this.stash(options.url)
      const headers = await this.headers(zapierUrl)
      const session = await this.session(options.folderId, headers.name, headers.size)
      return await this.upload(zapierUrl, session.data.id, headers.name, headers.size)
    } catch (error) {
      // @ts-ignore TODO: type for try/catch error
      throw new this.z.errors.HaltedError(error.message)
    }
  }

  /**
   * @param {string} url
   * @returns {Promise<string>}
   */
  async stash(url) {
    const filePromise = this.z.request({ url, raw: true })
    return await this.z.stashFile(filePromise)
  }

  /**
   * @param {string} url
   * @returns {Promise<Headers>}
   */
  async headers(url) {
    const { headers } = await fetch(url, { method: "HEAD" })
    const length = headers.get("content-length")
    const disposition = headers.get("content-disposition")
    const FileSize = length ? parseInt(length) : 0
    const FileName = disposition ? contentDisposition.parse(disposition).parameters.filename : "File from Zapier"
    return { size: FileSize, name: FileName }
  }

  /**
   * @param {number} folderId
   * @param {string} FileName
   * @param {number} FileSize
   * @returns {Promise<Session>}
   */
  async session(folderId, FileName, FileSize) {
    const body = {
      folderId,
      FileName,
      FileSize,
      CreateOn: new Date().toISOString()
    }
    const url = this.url(`/files/${folderId}/upload/create_session`)
    return await this.request("POST", url, body)
  }

  /**
   * @param {string} url
   * @param {string} sessionId
   * @param {string} FileName
   * @param {number} FileSize
   * @returns {Promise<UploadFileData>}
   */
  async upload(url, sessionId, FileName, FileSize) {
    const chunkSize = 10 * 1024 * 1024
    const chunks = Math.ceil(FileSize / chunkSize)
    let result
    for (let chunk = 0; chunk < chunks; chunk++) {
      const offset = chunk * chunkSize
      const headers = { Range: `bytes=${offset}-${offset + chunkSize - 1}` }
      const data = await this.fetchData(url, headers)
      const chunkBody = this.createForm(data, FileName)
      const chunkHeaders = chunkBody.getHeaders()
      const chunkUrl = `${this.baseUrl}/ChunkedUploader.ashx?uid=${sessionId}`
      result = await this.request("POST", chunkUrl, chunkBody, chunkHeaders)
    }
    return result
  }

  /**
   * @param {string} url
   * @param {HeadersInit} headers
   * @returns {Promise<Buffer>}
   */
  async fetchData(url, headers) {
    const response = await fetch(url, { headers })
    const data = await response.arrayBuffer()
    return Buffer.from(data)
  }

  /**
   * @param {ArrayBuffer} data
   * @param {string} filename
   * @returns {FormData}
   */
  createForm(data, filename) {
    const form = new FormData()
    form.append("file", data, { filename })
    return form
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

module.exports = { Client, Service, Progress, Upload }
