//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Service } = require("../client/client")

/**
 * @typedef {import("../client/client.js").Filters} Filters
 */

/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} displayName
 * @property {string=} avatar
 * @property {string=} avatarOriginal
 * @property {string=} avatarMax
 * @property {string=} avatarMedium
 * @property {string=} avatarSmall
 * @property {string} profileUrl
 * @property {boolean=} hasAvatar
 * @property {boolean=} isAnonim
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
 * @typedef {Object} TypeUpdateProgress
 * @property {string} id
 * @property {string} error
 * @property {number} percentage
 * @property {boolean} isCompleted
 * @property {number} status
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
 * @property {number=} quotaLimit
 * @property {number=} usedSpace
 * @property {string=} cultureName
 * @property {Account=} createdBy
 * @property {string=} registrationDate
 * @property {string} id
 * @property {string} displayName
 * @property {string} avatarSmall
 * @property {string=} avatarOriginal
 * @property {string} profileUrl
 * @property {boolean} hasAvatar
 * @property {boolean=} isAnonim
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
   * @param {Filters=} filters
   * @returns {Promise<User[]>}
   */
  listUsers(filters) {
    const url = this.client.url("/people", filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /people/email?email={{email}}
   * ```
   * @param {string} email
   * @returns {Promise<User>}
   */
  userByEmail(email) {
    const url = this.client.url("/people/email", { email })
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * PUT /people/status/{{status}}
   * ```
   * @param {"Active"|"Terminated"} status Terminated disables users.
   * @param {string[]} userIds
   * @returns {Promise<User[]>}
   */
  updateUserStatus(status, userIds) {
    const url = this.client.url(`/people/status/${status}`)
    return this.client.request("PUT", url, { userIds })
  }

  /**
   * ```http
   * GET /people/status/{{status}}
   * ```
   * @param {"Active"|"Terminated"} status
   * @param {Filters=} filters
   * @returns {Promise<User[]>}
   */
  listUsersByStatus(status, filters) {
    const url = this.client.url(`/people/status/${status}`, filters)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * PUT /people/type/{{type}}
   * ```
   * @param {string} type For example, RoomAdmin.
   * @param {string[]} userIds
   * @returns {Promise<User[]>}
   */
  updateUserType(type, userIds) {
    const url = this.client.url(`/people/type/${encodeURIComponent(type)}`)
    return this.client.request("PUT", url, { userIds })
  }

  /**
   * ```http
   * POST /people/type
   * ```
   * @param {{type: string, userId: string}} body
   * @returns {Promise<TypeUpdateProgress>}
   */
  startUserTypeUpdate(body) {
    const url = this.client.url("/people/type")
    return this.client.request("POST", url, body)
  }

  /**
   * ```http
   * GET /people/type/progress/{{userId}}
   * ```
   * @param {string} userId
   * @returns {Promise<TypeUpdateProgress>}
   */
  userTypeUpdateProgress(userId) {
    const url = this.client.url(`/people/type/progress/${encodeURIComponent(userId)}`)
    return this.client.request("GET", url)
  }

  /**
   * ```http
   * GET /people/{{userId}}
   * ```
   * @param {string} userId
   * @returns {Promise<User>}
   */
  user(userId) {
    const url = this.client.url(`/people/${encodeURIComponent(userId)}`)
    return this.client.request("GET", url)
  }
}

module.exports = {
  PeopleService
}
