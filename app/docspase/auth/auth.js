//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Service } = require("../client/client")

/**
 * @typedef {Object} AuthenticationData
 * @property {string} token
 */

/**
 * @typedef {Object} AuthenticationOptions
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Boolean} AuthenticationStatus
 */

/**
 * @typedef {Object} SessionAuthenticationData
 * @property {string} baseUrl
 * @property {string} sessionKey
 */

/**
 * @typedef {Object} SessionAuthenticationFields
 * @property {string} baseUrl
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} SessionAuthenticationUnapprovedData
 * @property {string=} baseUrl
 * @property {string=} sessionKey
 */

const beforeSessionAuthRequest = [
  /**
   * @param {HttpRequestOptions} request
   * @param {ZObject} _
   * @param {Bundle<SessionAuthenticationUnapprovedData>} bundle
   * @returns {HttpRequestOptions}
   */
  function appendSessionAuthHeader(request, _, bundle) {
    const { sessionKey } = bundle.authData
    if (sessionKey) {
      const headers = request.headers || {}
      headers["Authorization"] = sessionKey
      request.headers = headers
    }
    return request
  }
]

class AuthenticationService extends Service {
  /**
   * ```http
   * POST /authentication
   * ```
   * @param {AuthenticationOptions} data
   * @returns {Promise<AuthenticationData>}
   */
  auth(data) {
    const payload = {
      UserName: data.username,
      Password: data.password
    }
    const url = this.client.url("/authentication")
    return this.client.request("POST", url, payload)
  }

  /**
   * ```http
   * GET /authentication
   * ```
   * @returns {Promise<AuthenticationStatus>}
   */
  check() {
    const url = this.client.url("/authentication")
    return this.client.request("GET", url)
  }
}

module.exports = {
  beforeSessionAuthRequest,
  AuthenticationService
}
