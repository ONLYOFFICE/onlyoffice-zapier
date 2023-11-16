//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const normalizeUrl = require("normalize-url")
const { Service, Client } = require("./client")
const { PeopleService } = require("./people")

/**
 * @typedef {Object} SessionAuthenticationFields
 * @property {string} baseUrl
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} SessionAuthenticationData
 * @property {string} baseUrl
 * @property {string} sessionKey
 */

/**
 * @typedef {Object} SessionAuthenticationUnapprovedData
 * @property {string=} baseUrl
 * @property {string=} sessionKey
 */

const sessionAuth = {
  type: "session",
  sessionConfig: {
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationFields>} bundle
     * @returns {Promise<SessionAuthenticationData>}
     */
    async perform(z, bundle) {
      const baseUrl = normalizeUrl(bundle.authData.baseUrl)
      const client = new Client(baseUrl, z.request)
      const auth = new AuthenticationService(client)
      const data = await auth.auth(bundle.authData)
      return {
        baseUrl,
        sessionKey: data.token
      }
    }
  },

  fields: [
    {
      key: "baseUrl",
      label: "URL",
      required: true,
      helpText: "Go to the [API Details](https://my.site.com/manage/api-details) screen from your. Website Dashboard to find your API Key."
    },
    {
      key: "username",
      label: "Username",
      required: true
    },
    {
      key: "password",
      label: "Password",
      type: "password",
      required: true
    }
  ],

  /**
   * @param {ZObject} z
   * @param {Bundle<SessionAuthenticationUnapprovedData>} bundle
   * @returns {Promise<User | undefined>}
   */
  async test(z, bundle) {
    const { baseUrl } = bundle.authData
    if (!baseUrl) {
      return
    }

    const client = new Client(baseUrl, z.request)
    const auth = new AuthenticationService(client)

    const status = await auth.check()
    if (!status) {
      return
    }

    const people = new PeopleService(client)
    const user = await people.self()

    return user
  },

  connectionLabel: "{{firstName}} {{lastName}}"
}

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

/**
 * @typedef {Object} AuthenticationOptions
 * @property {string} username
 * @property {string} password
 */

/**
 * @typedef {Object} AuthenticationData
 * @property {string} token
 */

/**
 * @typedef {Boolean} AuthenticationStatus
 */

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
    return this.client.request("POST", "/authentication", payload)
  }

  /**
   * ```http
   * GET /authentication
   * ```
   * @returns {Promise<AuthenticationStatus>}
   */
  check() {
    return this.client.request("GET", "/authentication")
  }
}

module.exports = {
  sessionAuth,
  beforeSessionAuthRequest,
  AuthenticationService
}
