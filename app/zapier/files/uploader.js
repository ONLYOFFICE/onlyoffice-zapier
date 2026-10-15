
//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const contentDisposition = require("content-disposition")
const FormData = require("form-data")

/**
 * @typedef {import("../../docspace/files/files.js").ChunkData} ChunkData
 * @typedef {import("./actions.js").UploadFileFields} UploadFileFields
 */

/**
 * @typedef {Object} BodyUpload
 * @property {string} fileName
 * @property {number} fileSize
 * @property {string} fileStash
 * @property {Buffer=} data The whole file, if it has already been downloaded.
 */

/**
 * @typedef {Object} ErrorData
 * @property {string} message
 * @property {string} stack
 */

/**
 * @typedef {Object} UploadFileData
 * @property {number} bytes_total
 * @property {string} created
 * @property {string} expired
 * @property {string} id
 * @property {string}location
 * @property {number[]} path
 */

/**
 * @typedef {Object} Headers
 * @property {string} fileName
 * @property {number} fileSize
 * @property {Buffer=} data The whole file, if the size isn't known in advance.
 */

/**
 * @typedef {import("./actions.js").FileData} FileData
 */

/**
 * Files from previous Zap steps are hosted by Zapier and can be read directly.
 * Other URLs are downloaded with `z.request`, which doesn't follow redirects.
 * The host is parsed, because a prefix check also matches hosts like
 * `zapier.example.com`.
 * @param {string} url
 * @returns {boolean}
 */
function isZapierUrl(url) {
  try {
    const { hostname, protocol } = new URL(url)
    return protocol === "https:" && (hostname === "zapier.com" || hostname.endsWith(".zapier.com"))
  } catch {
    return false
  }
}

const DEFAULT_FILE_NAME = "File from Zapier"

/** @type {Record<string, string>} */
const EXTENSIONS = {
  "application/msword": ".doc",
  "application/pdf": ".pdf",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.oasis.opendocument.presentation": ".odp",
  "application/vnd.oasis.opendocument.spreadsheet": ".ods",
  "application/vnd.oasis.opendocument.text": ".odt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "text/csv": ".csv",
  "text/html": ".html",
  "text/markdown": ".md",
  "text/plain": ".txt"
}

/**
 * Picks the file name from the `Content-Disposition` header, then from the URL
 * if it has an extension. Otherwise, it uses a default name with the extension
 * of the content type.
 * @param {string} url
 * @param {string | null} disposition
 * @param {string | null} type
 * @returns {string}
 */
function fileName(url, disposition, type) {
  if (disposition) {
    try {
      const name = contentDisposition.parse(disposition).parameters.filename
      if (name) {
        return name
      }
    } catch {
      // Ignore a malformed header.
    }
  }
  try {
    const segments = new URL(url).pathname.split("/")
    const name = decodeURIComponent(segments[segments.length - 1])
    if (/^[^.].*\.[a-z0-9]+$/i.test(name)) {
      return name
    }
  } catch {
    // Ignore a URL that can't be parsed.
  }
  if (!type) {
    return `${DEFAULT_FILE_NAME}.docx`
  }
  const mime = type.split(";")[0].trim().toLowerCase()
  return `${DEFAULT_FILE_NAME}${EXTENSIONS[mime] || ""}`
}

class Uploader {
  /**
   * @param {ZObject} z
   */
  constructor(z) {
    this.z = z
  }

  /**
   * @param {string} url
   * @returns {Promise<string>}
   */
  async stash(url) {
    let zapierUrl
    if (isZapierUrl(url)) {
      zapierUrl = url
    } else {
      const filePromise = this.z.request({
        raw: true,
        redirect: "error",
        url
      })
      zapierUrl = await this.z.stashFile(filePromise)
    }
    return zapierUrl
  }

  /**
   * @param {string} url
   * @returns {Promise<Headers>}
   */
  async headers(url) {
    const { headers } = await fetch(url, { method: "HEAD" })
    const length = headers.get("content-length")
    const name = fileName(url, headers.get("content-disposition"), headers.get("content-type"))
    if (length) {
      return { fileName: name, fileSize: parseInt(length) }
    }
    // The upload session needs the file size. If the server doesn't send it,
    // download the file first.
    const data = await this.fetchData(url, {})
    return { data, fileName: name, fileSize: data.length }
  }

  /**
   * @param {BodyUpload} bodyUpload
   * @param {(arg0: ChunkData) => Promise<UploadFileData>} uploadChunk
   * @returns {Promise<UploadFileData>}
   */
  async upload(bodyUpload, uploadChunk) {
    let result
    if (bodyUpload.fileSize <= 0) {
      throw new this.z.errors.HaltedError("The file is empty")
    }
    const chunkSize = 10 * 1024 * 1024
    const chunks = Math.ceil(bodyUpload.fileSize / chunkSize)
    for (let currentChunk = 0; currentChunk < chunks; currentChunk = currentChunk + 1) {
      const offset = currentChunk * chunkSize
      const data = await this.readChunk(bodyUpload, offset, chunkSize)
      const chunkBody = this.createForm(data, bodyUpload.fileName)
      const chunkHeaders = chunkBody.getHeaders()
      const chunk = {
        body: chunkBody,
        headers: chunkHeaders
      }
      result = await uploadChunk(chunk)
    }
    if (!result) {
      throw new this.z.errors.HaltedError("Unknown error")
    }
    return result
  }

  /**
   * Reads a chunk with a range request. If the server ignores the range and
   * sends the whole file, the file is kept and the next chunks are read from it.
   * @param {BodyUpload} bodyUpload
   * @param {number} offset
   * @param {number} chunkSize
   * @returns {Promise<Buffer>}
   */
  async readChunk(bodyUpload, offset, chunkSize) {
    if (!bodyUpload.data) {
      const headers = { Range: `bytes=${offset}-${offset + chunkSize - 1}` }
      const response = await fetch(bodyUpload.fileStash, { headers })
      const content = Buffer.from(await response.arrayBuffer())
      if (response.status === 206) {
        return content
      }
      bodyUpload.data = content
    }
    return bodyUpload.data.subarray(offset, offset + chunkSize)
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
   * @param {Buffer} data
   * @param {string} filename
   * @returns {FormData}
   */
  createForm(data, filename) {
    const form = new FormData()
    form.append("file", data, { filename })
    return form
  }
}

module.exports = {
  Uploader,
  fileName,
  isZapierUrl
}
