
//
// (c) Copyright Ascensio System SIA 2023
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
 */

/**
 * @typedef {Object} ErrorData
 * @property {string} message
 * @property {string} stack
 */

/**
 * @typedef {Object} UploadFileData
 * @property {number} id
 * @property {number} folderId
 * @property {number} version
 * @property {string} title
 * @property {boolean} uploaded
 * @property {FileData} file
 */

/**
 * @typedef {Object} Headers
 * @property {string} fileName
 * @property {number} fileSize
 */

/**
 * @typedef {import("./actions.js").FileData} FileData
 */

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
    if (url.startsWith("https://zapier.com/engine/hydrate/")) {
      zapierUrl = url
    } else {
      const filePromise = this.z.request({ raw: true, url })
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
    const disposition = headers.get("content-disposition")
    const fileSize = length ? parseInt(length) : 0
    const fileName = disposition ? contentDisposition.parse(disposition).parameters.filename : "File from Zapier.docx"
    return { fileName, fileSize }
  }

  /**
   * @param {BodyUpload} bodyUpload
   * @param {(arg0: ChunkData) => Promise<UploadFileData>} uploadChunk
   * @returns {Promise<UploadFileData>}
   */
  async upload(bodyUpload, uploadChunk) {
    let result
    const chunkSize = 10 * 1024 * 1024
    const chunks = Math.ceil(bodyUpload.fileSize / chunkSize)
    for (let currentChunk = 0; currentChunk < chunks; currentChunk = currentChunk + 1) {
      const offset = currentChunk * chunkSize
      const headers = { Range: `bytes=${offset}-${offset + chunkSize - 1}` }
      const data = await this.fetchData(bodyUpload.fileStash, headers)
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

module.exports = {
  Uploader
}
