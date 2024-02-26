//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Service } = require("../client/client")

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
 * @property {string=} workFrom
 * @property {string} avatarMax
 * @property {string} avatarMedium
 * @property {string} avatar
 * @property {boolean} isAdmin
 * @property {boolean} isRoomAdmin
 * @property {boolean} isLDAP
 * @property {Array<string>=} listAdminModules
 * @property {boolean} isOwner
 * @property {boolean} isVisitor
 * @property {boolean} isCollaborator
 * @property {string=} mobilePhone
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
  PeopleService
}
