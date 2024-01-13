//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client } = require("../../docspase/client/client.js")
const { FilesService } = require("../../docspase/files/files.js")
const samples = require("../../docspase/files/files.samples.js")

/**
 * @typedef {import("../../docspase/files/files.js").FileData} FileData
 * @typedef {import("../../docspase/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 */

/**
 * @typedef {Object} SearchFields
 * @property {number} folderId
 * @property {string} title
 */

const searchFile = {
  display: {
    description: "Search a file.",
    label: "Search File"
  },
  key: "searchFile",
  noun: "Files",
  operation: {
    inputFields: [
      {
        dynamic: "filteredSections.id.title",
        helpText: "Search section",
        key: "folderId",
        label: "Section",
        required: true,
        type: "integer"
      },
      {
        helpText: "File title or extension",
        key: "title",
        label: "Title",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, SearchFields>} bundle
     * @returns {Promise<FileData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        sortBy: "DateAndTime",
        sortOrder: "descending",
        withSubfolders: true
      }
      const filesList = await files.listFiles(bundle.inputData.folderId, filters)
      return filesList.files.filter((file) => file.title.includes(bundle.inputData.title))
    },
    sample: samples.file
  }
}

const searchFolder = {
  display: {
    description: "Search a folder.",
    label: "Search Folder"
  },
  key: "searchFolder",
  noun: "Folders",
  operation: {
    inputFields: [
      {
        dynamic: "filteredSections.id.title",
        helpText: "Search section",
        key: "folderId",
        label: "Section",
        required: true,
        type: "integer"
      },
      {
        helpText: "Folder title",
        key: "title",
        label: "Title",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, SearchFields>} bundle
     * @returns {Promise<FolderData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      const filters = {
        sortBy: "DateAndTime",
        sortOrder: "descending",
        withSubfolders: true
      }
      const folderList = await files.listFolders(bundle.inputData.folderId, filters)
      return folderList.folders.filter((folder) => folder.title.includes(bundle.inputData.title))
    },
    sample: samples.folder
  }
}

module.exports = {
  searchFile,
  searchFolder
}
