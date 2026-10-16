//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client } = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")

/**
 * @typedef {Object} DownloadFileInputData
 * @property {number} fileId
 */

/**
 * The file is downloaded only when a later step uses it, which can be much
 * later. The download link expires, so it is requested at that moment.
 * @param {ZObject} z
 * @param {import("zapier-platform-core").Bundle<DownloadFileInputData>} bundle
 * @returns {Promise<string>}
 */
const downloadFile = async (z, bundle) => {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const link = await files.downloadLink(bundle.inputData.fileId)
  const filePromise = z.request({
    raw: true,
    redirect: "error",
    url: link.url
  })
  return z.stashFile(filePromise)
}

module.exports = {
  downloadFile
}
