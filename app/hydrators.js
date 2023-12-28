//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @param {ZObject} z
 * @param {{ inputData: { url: string; }; }} bundle // TODO Bundle<SessionAuthenticationData, InputData> not work
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
