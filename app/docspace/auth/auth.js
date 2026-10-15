//
// (c) Copyright Ascensio System SIA 2026
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

/**
 * @param {string | undefined} url
 * @param {string | undefined} baseUrl
 * @returns {boolean}
 */
function isSameOrigin(url, baseUrl) {
  if (!url || !baseUrl) {
    return false
  }
  try {
    return new URL(url).origin === new URL(baseUrl).origin
  } catch {
    return false
  }
}

const beforeSessionAuthRequest = [
  /**
   * Send the session key only to the workspace, because it gives full access
   * to it.
   * @param {HttpRequestOptions} request
   * @param {ZObject} _
   * @param {Bundle<SessionAuthenticationUnapprovedData>} bundle
   * @returns {HttpRequestOptions}
   */
  function appendSessionAuthHeader(request, _, bundle) {
    const { baseUrl, sessionKey } = bundle.authData
    if (sessionKey && isSameOrigin(request.url, baseUrl)) {
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
      Password: data.password,
      UserName: data.username
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
  AuthenticationService,
  beforeSessionAuthRequest,
  isSameOrigin
}
