//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Service } = require("./client.js")

/**
 * @typedef {Object} User
 * @property {string} firstName
 * @property {string} lastName
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
}

module.exports = { PeopleService }
