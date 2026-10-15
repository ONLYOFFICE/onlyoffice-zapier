//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client, REMOVED_USER_ID } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const { pageFilters } = require("../pagination.js")
const samples = require("../../docspace/people/people.samples.js")

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
  var users = await people.listUsers(pageFilters(bundle))
  users = users.filter((item) => item.id !== REMOVED_USER_ID)
  return users
}

// Only Full admins and Room admins can subscribe to the `user.created` event,
// so this trigger uses polling.
const userAdded = {
  display: {
    description: "Triggers when a user is added.",
    label: "User Added"
  },
  key: "userAdded",
  noun: "Users",
  operation: {
    canPaginate: true,
    perform: performUserAdded,
    sample: samples.user
  }
}

module.exports = {
  userAdded
}
