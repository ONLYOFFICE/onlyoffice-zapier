//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { version: platformVersion } = require("zapier-platform-core")
const { beforeSessionAuthRequest, sessionAuth } = require("./auth.js")
const { createFile, createFileInMyDocuments, roomCreated } = require("./files.js")
const { version } = require("../package.json")

const App = {
  version,
  platformVersion,
  authentication: sessionAuth,
  beforeRequest: [
    ...beforeSessionAuthRequest
  ],
  triggers: {
    [roomCreated.key]: roomCreated
  },
  creates: {
    [createFile.key]: createFile,
    [createFileInMyDocuments.key]: createFileInMyDocuments
  }
}

module.exports = { App }
