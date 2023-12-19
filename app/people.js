//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Service } = require("./client.js")
const samples = require("./people.samples.js")

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} displayName
 * @property {string} profileUrl
 */

/**
 * @typedef {Object} Invitations
 * @property {string} email
 * @property {string} type
 */

/**
 * @typedef {Object} InviteUserFields
 * @property {string} email
 * @property {string} type
 */

/**
 * @typedef {Object} InviteUserBody
 * @property {Invitations[]} invitations
 */

/**
 * @typedef {Object} User
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} userName
 * @property {string} email
 * @property {number} status
 * @property {number} activationStatus
 * @property {string} department
 * @property {string} workFrom
 * @property {string} avatarMax
 * @property {string} avatarMedium
 * @property {string} avatar
 * @property {boolean} isAdmin
 * @property {boolean} isRoomAdmin
 * @property {boolean} isLDAP
 * @property {Array<string>} listAdminModules
 * @property {boolean} isOwner
 * @property {boolean} isVisitor
 * @property {boolean} isCollaborator
 * @property {string} mobilePhone
 * @property {number} mobilePhoneActivationStatus
 * @property {boolean} isSSO
 * @property {number} quotaLimit
 * @property {number} usedSpace
 * @property {string} id
 * @property {string} displayName
 * @property {string} avatarSmall
 * @property {string} profileUrl
 * @property {boolean} hasAvatar
 */

// Triggers
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

// Actions
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
        label: "EMail",
        key: "email",
        required: true
      },
      {
        label: "Role",
        key: "type",
        required: true,
        choices: { "2": "User", "4": "Power user", "1": "Room admin", "3": "DocSpace admin" }
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, InviteUserFields>} bundle
     * @returns {Promise<Account>}
     */
    async perform(z, bundle) {
      /**
       * @param {Account[]} array
       * @param {string} email
       * @returns {Account|null}
       */
      const findInvitedUser = function (array, email) {
        for (let i = 0; i < array.length; i++) {
          if (array[i].displayName === email) {
            return array[i]
          }
        }
        return null
      }

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
      const invitedUser = findInvitedUser(accounts, bundle.inputData.email)
      if (invitedUser) return invitedUser
      throw new z.errors.HaltedError("Could not find invited user in response")
    },
    sample: samples.account
  }
}

class PeopleService extends Service {
  /**
   * ```http
   * GET /people/@self
   * ```
   * @returns {Promise<User>}
   */
  async self() {
    const url = this.client.url("/people/@self")
    return await this.client.request("GET", url)
  }

  /**
   * ```http
   * POST /people/invite
   * ```
   * @param {InviteUserBody} body
   * @returns {Promise<Account[]>}
   */
  inviteUser(body) {
    const url = this.client.url("/people/invite")
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * GET /people
   * ```
   * @returns {Promise<User[]>}
   */
  listUsers() {
    const url = this.client.url("/people")
    return this.client.request("GET", url)
  }
}

module.exports = {
  inviteUser,
  userAdded,
  PeopleService
}
