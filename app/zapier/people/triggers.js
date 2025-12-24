//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const { Client, REMOVED_USER_ID } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const samples = require("../../docspace/people/people.samples.js")
const { createWebhookTrigger } = require("../webhooks/hooks.js")
const { USER_ADDED } = require("../../docspace/webhooks/events.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {Promise<User[]>}
 */
async function performUserAdded(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const people = new PeopleService(client)
  var users = await people.listUsers()
  users = users.filter((item) => item.id !== REMOVED_USER_ID)
  return users
}

const userAdded = createWebhookTrigger(
  "userAdded",
  "User Added",
  "Triggers when a user is added.",
  [USER_ADDED],
  {
    noun: "Users",
    pollingFallback: performUserAdded,
    sample: samples.user
  }
)

module.exports = {
  userAdded
}
