//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Client, Service } = require("./client.js")
const samples = require("./people.samples.js")

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
  userAdded,
  PeopleService
}
