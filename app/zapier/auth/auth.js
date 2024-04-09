//
// (c) Copyright Ascensio System SIA 2024
//

const normalizeUrl = require("normalize-url")
const { AuthenticationService } = require("../../docspace/auth/auth")
const { Client } = require("../../docspace/client/client")
const { PeopleService } = require("../../docspace/people/people")

// @ts-check

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationFields} SessionAuthenticationFields
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationUnapprovedData} SessionAuthenticationUnapprovedData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

const sessionAuth = {
  connectionLabel: "{{firstName}} {{lastName}}",
  fields: [
    {
      helpText: "Enter [URL](https://api.onlyoffice.com/docspace/backend/howitworks/auth) of your DocSpace.",
      key: "baseUrl",
      label: "DocSpace Service Address",
      required: true
    },
    {
      key: "username",
      label: "Email",
      required: true
    },
    {
      key: "password",
      label: "Password",
      required: true,
      type: "password"
    }
  ],

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

  type: "session"
}

module.exports = {
  sessionAuth
}
