//
// (c) Copyright Ascensio System SIA 2025
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
    redirect: "error",
    url: bundle.inputData.url
  })
  return z.stashFile(filePromise)
}

module.exports = {
  stashFile
}
