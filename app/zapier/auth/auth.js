//
// (c) Copyright Ascensio System SIA 2026
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
      helpText: "Enter [URL](https://api.onlyoffice.com/docspace/api-backend/get-started/authentication/basic-authentication/) of your ONLYOFFICE Apps workspace.",
      key: "baseUrl",
      label: "Workspace Address",
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
      // Only HTTPS is allowed, because the email and password are sent.
      if (!/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(bundle.authData.baseUrl)) {
        throw new Error("Invalid Workspace Address format. The address must start with https://")
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bundle.authData.username)) {
        throw new Error("Invalid Email format")
      }
      // By default, normalize-url removes "www.", which changes the host.
      const baseUrl = normalizeUrl(bundle.authData.baseUrl, { stripWWW: false })
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
   * @returns {Promise<User>}
   */
  async test(z, bundle) {
    const { baseUrl } = bundle.authData
    if (!baseUrl) {
      throw new Error("The Workspace Address is missing")
    }

    const client = new Client(baseUrl, z.request)
    const auth = new AuthenticationService(client)

    // On RefreshAuthError, Zapier signs in again with the saved credentials.
    const status = await auth.check()
    if (!status) {
      throw new z.errors.RefreshAuthError("The session has expired")
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
