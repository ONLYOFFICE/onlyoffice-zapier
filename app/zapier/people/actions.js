//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client, isNotFoundError } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const samples = require("../../docspace/people/people.samples.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").Account} Account
 * @typedef {import("../../docspace/people/people.js").User} User
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

/**
 * Finds a user by email, including users who haven't accepted the invitation
 * yet.
 * @param {PeopleService} people
 * @param {string} email
 * @returns {Promise<User | undefined>}
 */
async function findUser(people, email) {
  try {
    return await people.userByEmail(email)
  } catch (error) {
    if (isNotFoundError(error)) {
      return
    }
    throw error
  }
}

const inviteUser = {
  display: {
    description: "Invites a user to the current workspace.",
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
          choices[1] = "Room admin"
        }
        if (user?.isOwner) {
          choices[4] = "User"
          choices[3] = "Full admin"
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
     * @returns {Promise<User>}
     */
    async perform(z, bundle) {
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      const { email } = bundle.inputData
      const existingUser = await findUser(people, email)
      if (existingUser) {
        return existingUser
      }
      const body = {
        invitations: [{
          email,
          type: bundle.inputData.type
        }]
      }
      await people.inviteUser(body)
      const invitedUser = await findUser(people, email)
      if (invitedUser) {
        return invitedUser
      }
      throw new z.errors.HaltedError("Could not find the invited user in the response.")
    },
    sample: samples.invitedUser
  }
}

module.exports = {
  inviteUser
}

