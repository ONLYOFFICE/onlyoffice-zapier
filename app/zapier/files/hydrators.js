//
// (c) Copyright Ascensio System SIA 2024
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
    raw: true,
    url: bundle.inputData.url
  })
  return z.stashFile(filePromise)
}

module.exports = {
  stashFile
}
