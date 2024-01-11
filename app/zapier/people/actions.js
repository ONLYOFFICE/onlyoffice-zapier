//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client } = require("../../docspase/client/client.js")
const { PeopleService } = require("../../docspase/people/people.js")
const samples = require("../../docspase/people/people.samples.js")

/**
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspase/people/people.js").Account} Account
 * @typedef {import("../../docspase/people/people.js").InviteUserBody} InviteUserBody
 */

/**
 * @typedef {Object} InviteUserFields
 * @property {string} email
 * @property {string} type
 */

const inviteUser = {
  key: "inviteUser",
  noun: "User",
  display: {
    label: "Invite User",
    description: "Invites user to the current portal."
  },
  operation: {
    inputFields: [
      {
        label: "Email",
        key: "email",
        required: true
      },
      {
        label: "Role",
        key: "type",
        required: true,
        choices: {
          "2": "User",
          "4": "Power user",
          "1": "Room admin",
          "3": "DocSpace admin"
        }
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, InviteUserFields>} bundle
     * @returns {Promise<Account>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      /** @type {InviteUserBody} */
      const body = {
        invitations: [{
          email: bundle.inputData.email,
          type: bundle.inputData.type
        }]
      }
      const accounts = await people.inviteUser(body)
      let invitedUser
      for (let i = 0; i < accounts.length; i++) {
        if (accounts[i].displayName === bundle.inputData.email) {
          invitedUser = accounts[i]
          break
        }
      }
      if (invitedUser) {
        return invitedUser
      }
      throw new z.errors.HaltedError("Could not find invited user in response")
    },
    sample: samples.account
  }
}

module.exports = {
  inviteUser
}

