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
  key: "searchFile",
  noun: "Files",
  display: {
    label: "Search File",
    description: "Search a file."
  },
  operation: {
    inputFields: [
      {
        label: "Section",
        key: "folderId",
        required: true,
        type: "integer",
        dynamic: "filteredSections.id.title",
        helpText: "Search section"
      },
      {
        label: "Title",
        key: "title",
        required: true,
        helpText: "File title or extension"
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
      return filesList.files.filter(file => file.title.includes(bundle.inputData.title))
    },
    sample: samples.file
  }
}

const searchFolder = {
  key: "searchFolder",
  noun: "Folders",
  display: {
    label: "Search Folder",
    description: "Search a folder."
  },
  operation: {
    inputFields: [
      {
        label: "Section",
        key: "folderId",
        required: true,
        type: "integer",
        dynamic: "filteredSections.id.title",
        helpText: "Search section"
      },
      {
        label: "Title",
        key: "title",
        required: true,
        helpText: "Folder title"
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
      return folderList.folders.filter(folder => folder.title.includes(bundle.inputData.title))
    },
    sample: samples.folder
  }
}

module.exports = {
  searchFile,
  searchFolder
}
