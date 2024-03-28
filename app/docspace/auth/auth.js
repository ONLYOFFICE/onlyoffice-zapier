//
// (c) Copyright Ascensio System SIA 2024
//

// @ts-check

const { Service } = require("../client/client")

/**
 * @typedef {Object} AuthenticationData
 * @property {string} token
 */

/**
 * @typedef {Object} AuthenticationOptions
 * @property {string=} code
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Boolean} AuthenticationStatus
 */

/**
 * @typedef {Object} PayloadData
 * @property {string=} Code
 * @property {string} Password
 * @property {string} UserName
 */

/**
 * @typedef {Object} SessionAuthenticationData
 * @property {string} baseUrl
 * @property {string} sessionKey
 */

/**
 * @typedef {Object} SessionAuthenticationFields
 * @property {string} baseUrl
 * @property {string=} code
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
    /** @type {PayloadData} */
    const payload = {
      Password: data.password,
      UserName: data.username
    }
    if (data.code) {
      payload.Code = data.code
    }
    const url = this.client.url("/authentication" + (data.code ? "/" + data.code : ""))
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
  AuthenticationService,
  beforeSessionAuthRequest
}
