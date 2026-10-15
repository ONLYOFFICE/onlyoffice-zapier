//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client, normalizeId } = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const samples = require("../../docspace/files/files.samples.js")

/**
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/client/client.js").Filters} Filters
 */

/**
 * @typedef {Object} SearchFields
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @param {string} title
 * @param {string} query
 * @returns {boolean}
 */
function includesTitle(title, query) {
  return title.toLowerCase().includes(query.toLowerCase())
}

/**
 * Searches entries by the title. In most sections, the server does the search.
 * The Rooms section returns nothing for it, so its first page is searched
 * instead.
 * @template {{title: string}} T
 * @param {(filters: Filters) => Promise<T[]>} list
 * @param {string} title
 * @returns {Promise<T[]>}
 */
async function searchByTitle(list, title) {
  const filters = {
    sortBy: "DateAndTime",
    sortOrder: "descending",
    withSubfolders: true
  }
  let items = await list({
    ...filters,
    filterValue: title
  })
  if (items.length === 0) {
    items = await list(filters)
  }
  return items.filter((item) => includesTitle(item.title, title))
}

const searchFile = {
  display: {
    description: "Search for a file.",
    label: "Search File"
  },
  key: "searchFile",
  noun: "Files",
  operation: {
    inputFields: [
      {
        dynamic: "filteredSections.id.title",
        helpText: "Search for a section",
        key: "folderId",
        label: "Section",
        required: true,
        type: "string"
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
      const results = await searchByTitle(
        async (filters) => (await files.listFiles(bundle.inputData.folderId, filters)).files,
        bundle.inputData.title
      )
      results.forEach((file) => {
        file.id = normalizeId(file.id)
      })
      return results
    },
    sample: samples.file
  }
}

const searchFolder = {
  display: {
    description: "Search for a folder.",
    label: "Search Folder"
  },
  key: "searchFolder",
  noun: "Folders",
  operation: {
    inputFields: [
      {
        dynamic: "filteredSections.id.title",
        helpText: "Search for a section",
        key: "folderId",
        label: "Section",
        required: true,
        type: "string"
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
      const results = await searchByTitle(
        async (filters) => (await files.listFolders(bundle.inputData.folderId, filters)).folders,
        bundle.inputData.title
      )
      results.forEach((folder) => {
        folder.id = normalizeId(folder.id)
      })
      return results
    },
    sample: samples.folder
  }
}

module.exports = {
  searchFile,
  searchFolder
}
