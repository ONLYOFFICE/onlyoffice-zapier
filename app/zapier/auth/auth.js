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
  connectionLabel: "{{firstName}} {{lastName}} ({{email}})",
  fields: [
    {
      helpText: "The address of your ONLYOFFICE Apps workspace, for example https://yourname.onlyoffice.com.",
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
      helpText: "Sign-in with two-factor authentication or SSO isn't supported.",
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
        throw new Error("Enter the full workspace address that starts with https://, for example https://yourname.onlyoffice.com.")
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bundle.authData.username)) {
        throw new Error("Enter a valid email.")
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
      throw new Error("The workspace address is missing.")
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
