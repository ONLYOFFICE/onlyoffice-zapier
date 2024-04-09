//
// (c) Copyright Ascensio System SIA 2024
//

// @ts-check

const { Client } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const samples = require("../../docspace/people/people.samples.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

const userAdded = {
  display: {
    description: "Triggers when a user is added.",
    label: "User Added"
  },
  key: "userAdded",
  noun: "Users",
  operation: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData>} bundle
     * @returns {Promise<User[]>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      return await people.listUsers()
    },
    sample: samples.user
  }
}

module.exports = {
  userAdded
}
