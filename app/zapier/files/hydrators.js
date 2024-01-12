//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @typedef {Object} InputData
 * @property {string} url
 */

/**
 * @param {ZObject} z
 * @param {import("zapier-platform-core").Bundle<InputData>} bundle
 * @returns {Promise<string>}
 */

const stashFile = async (z, bundle) => {
  const filePromise = z.request({
    url: bundle.inputData.url,
    raw: true
  })
  return z.stashFile(filePromise)
}

module.exports = {
  stashFile
}
