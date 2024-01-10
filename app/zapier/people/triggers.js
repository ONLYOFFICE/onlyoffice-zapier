//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client } = require("../../docspase/client/client.js")
const { PeopleService } = require("../../docspase/people/people.js")
const samples = require("../../docspase/people/people.samples.js")

/**
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspase/people/people.js").User} User
 */

const userAdded = {
  key: "userAdded",
  noun: "Users",
  display: {
    label: "User Added",
    description: "Triggers when a user is added."
  },
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
