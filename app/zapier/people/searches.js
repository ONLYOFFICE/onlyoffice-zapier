//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client, isNotFoundError } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const samples = require("../../docspace/people/people.samples.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

/**
 * @typedef {Object} SearchUserFields
 * @property {string} email
 */

const searchUser = {
  display: {
    description: "Finds a user of the workspace by email.",
    label: "Find User"
  },
  key: "searchUser",
  noun: "User",
  operation: {
    inputFields: [
      {
        key: "email",
        label: "Email",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, SearchUserFields>} bundle
     * @returns {Promise<User[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      try {
        return [await people.userByEmail(bundle.inputData.email)]
      } catch (error) {
        if (isNotFoundError(error)) {
          return []
        }
        throw error
      }
    },
    sample: samples.user
  }
}

module.exports = {
  searchUser
}
