//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { App } = require("../../app.js")
const { inviteUser } = require("./actions.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("./actions.js").InviteUserFields} InviteUserFields
 */

const tester = createAppTester(App)

/**
 * @param {SessionAuthenticationData} authData
 * @returns {Promise<string>}
 */
async function invitedUser(authData) {
  const { perform } = inviteUser.operation
  /** @type {InviteUserFields} */
  const inputData = {
    email: "whatever@onlyoffice.io",
    type: "4" // User
  }
  const bundle = {
    authData: authData,
    inputData
  }
  const user = await tester(perform, bundle)
  return user.id
}

module.exports = {
  invitedUser
}
