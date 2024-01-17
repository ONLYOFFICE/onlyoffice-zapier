//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const samples = require("../../docspace/people/people.samples.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").Account} Account
 */

/**
 * @typedef {Object} InviteUserFields
 * @property {string} email
 * @property {string} type
 */

const inviteUser = {
  display: {
    description: "Invites user to the current portal.",
    label: "Invite User"
  },
  key: "inviteUser",
  noun: "User",
  operation: {
    inputFields: [
      {
        key: "email",
        label: "Email",
        required: true
      },
      {
        choices: {
          "1": "Room admin",
          "2": "User",
          "3": "DocSpace admin",
          "4": "Power user"
        },
        key: "type",
        label: "Role",
        required: true
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, InviteUserFields>} bundle
     * @returns {Promise<Account>}
     */
    async perform(z, bundle) {
      /**
       * @param {string} email
       * @param {Account[]} accounts
       * @returns {Account|undefined}
       */
      function findUser(email, accounts) {
        for (let i = 0; i < accounts.length; i = i + 1) {
          if (accounts[i].displayName === email) {
            return accounts[i]
          }
        }
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      const userList = await people.listUsers()
      let invitedUser = findUser(bundle.inputData.email, userList)
      if (invitedUser) {
        return invitedUser
      }
      const body = {
        invitations: [{
          email: bundle.inputData.email,
          type: bundle.inputData.type
        }]
      }
      const accounts = await people.inviteUser(body)
      invitedUser = findUser(bundle.inputData.email, accounts)
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

