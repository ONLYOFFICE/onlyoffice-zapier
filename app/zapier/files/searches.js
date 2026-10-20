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
 * @typedef {import("../../docspace/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/client/client.js").Filters} Filters
 */

/**
 * @typedef {Object} SearchFields
 * @property {number} folderId
 * @property {string} title
 */

/**
 * @typedef {Object} SearchRoomFields
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
    description: "Finds a file by title in a section.",
    label: "Find File"
  },
  key: "searchFile",
  noun: "File",
  operation: {
    inputFields: [
      {
        dynamic: "filteredSections.id.title",
        helpText: "The section to search in, including its subfolders.",
        key: "folderId",
        label: "Section",
        required: true,
        type: "string"
      },
      {
        helpText: "The whole or part of the file title, for example Report or .pdf.",
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
    sample: samples.foundFile
  }
}

const searchFolder = {
  display: {
    description: "Finds a folder by title in a section.",
    label: "Find Folder"
  },
  key: "searchFolder",
  noun: "Folder",
  operation: {
    inputFields: [
      {
        dynamic: "filteredSections.id.title",
        helpText: "The section to search in, including its subfolders.",
        key: "folderId",
        label: "Section",
        required: true,
        type: "string"
      },
      {
        helpText: "The whole or part of the folder title.",
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

const searchRoom = {
  display: {
    description: "Finds a room by title.",
    label: "Find Room"
  },
  key: "searchRoom",
  noun: "Room",
  operation: {
    inputFields: [
      {
        helpText: "The whole or part of the room title.",
        key: "title",
        label: "Title",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, SearchRoomFields>} bundle
     * @returns {Promise<RoomData[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const files = new FilesService(client)
      // DocSpace saves the sort order of a request as the default order of
      // the user, so sort the rooms here.
      const filters = { filterValue: bundle.inputData.title }
      const rooms = await files.listRooms(filters)
      // Form filling rooms are in the separate Forms section.
      const forms = await files.listRooms({ ...filters, searchArea: "Forms" })
      const ids = new Set(rooms.folders.map((room) => String(room.id)))
      const results = rooms.folders.concat(forms.folders.filter((room) => !ids.has(String(room.id))))
      results.sort((a, b) => (Date.parse(b.updated) || 0) - (Date.parse(a.updated) || 0))
      results.forEach((room) => {
        room.id = normalizeId(room.id)
      })
      return results
    },
    sample: samples.room
  }
}

module.exports = {
  searchFile,
  searchFolder,
  searchRoom
}
