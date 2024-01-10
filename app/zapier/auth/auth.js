//
// (c) Copyright Ascensio System SIA 2023
//

const normalizeUrl = require("normalize-url")
const { AuthenticationService } = require("../../docspase/auth/auth")
const { Client } = require("../../docspase/client/client")
const { PeopleService } = require("../../docspase/people/people")

// @ts-check

/**
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationFields} SessionAuthenticationFields
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationUnapprovedData} SessionAuthenticationUnapprovedData
 * @typedef {import("../../docspase/people/people.js").User} User
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

module.exports = {
  sessionAuth
}
