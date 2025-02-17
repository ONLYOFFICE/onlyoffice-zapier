//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const { Client, REMOVED_USER_ID } = require("../../docspace/client/client.js")
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

/**
 * @typedef {Object} InvitedRole
 * @property {Record<number, string>} choices
 * @property {string} key
 * @property {string} label
 * @property {boolean} required
 */

const inviteUser = {
  display: {
    description: "Invites a user to the current portal.",
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
      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<InvitedRole[]>}
       */
      async function (z, bundle) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const people = new PeopleService(client)
        const user = await people.self()
        /** @type {Record<number, string>} */
        const choices = {}
        if (user?.isRoomAdmin) {
          choices[4] = "User"
        }
        if (user?.isAdmin) {
          choices[4] = "User"
          choices[3] = "DocSpace admin"
          choices[1] = "Room admin"
        }
        return [{
          choices: choices,
          key: "type",
          label: "Role",
          required: true
        }]
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
      let users = await people.listUsers()
      users = users.filter((item) => item.id !== REMOVED_USER_ID)
      let invitedUser = findUser(bundle.inputData.email, users)
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
      throw new z.errors.HaltedError("Could not find the invited user in the response.")
    },
    sample: samples.account
  }
}

module.exports = {
  inviteUser
}

