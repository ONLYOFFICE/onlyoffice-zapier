//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Client, isNotFoundError, responseStatus } = require("../../docspace/client/client.js")
const { PeopleService } = require("../../docspace/people/people.js")
const samples = require("../../docspace/people/people.samples.js")
const { noRightsField } = require("../fields.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

/**
 * @typedef {Object} InviteUserFields
 * @property {string} email
 * @property {string} type
 */

/**
 * @typedef {Object} InvitedRole
 * @property {Record<number, string>} choices
 * @property {string} key
 * @property {string} label
 * @property {boolean} required
 */

/**
 * Finds a user by email, including users who haven't accepted the invitation
 * yet.
 * @param {PeopleService} people
 * @param {string} email
 * @returns {Promise<User | undefined>}
 */
async function findUser(people, email) {
  try {
    return await people.userByEmail(email)
  } catch (error) {
    if (isNotFoundError(error)) {
      return
    }
    throw error
  }
}

const inviteUser = {
  display: {
    description: "Invites a person to the workspace by email.",
    label: "Invite User"
  },
  key: "inviteUser",
  noun: "User",
  operation: {
    inputFields: [
      {
        key: "email",
        label: "Email",
        required: true
      },
      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<Object[]>}
       */
      async function (z, bundle) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const people = new PeopleService(client)
        const user = await people.self()
        if (!user?.isOwner && !user?.isAdmin && !user?.isRoomAdmin) {
          return noRightsField("Only Room admins and Full admins can invite people to the workspace.")
        }
        /** @type {Record<number, string>} */
        const choices = {}
        if (user?.isRoomAdmin) {
          choices[4] = "User"
        }
        if (user?.isAdmin) {
          choices[4] = "User"
          choices[1] = "Room admin"
        }
        if (user?.isOwner) {
          choices[4] = "User"
          choices[3] = "Full admin"
          choices[1] = "Room admin"
        }
        return [{
          choices: choices,
          key: "type",
          label: "User type",
          required: true
        }]
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, InviteUserFields>} bundle
     * @returns {Promise<User>}
     */
    async perform(z, bundle) {
      if (!bundle.inputData.type) {
        throw new z.errors.Error(
          "Choose the user type. Only Room admins and Full admins can invite people.",
          "InvalidData",
          400
        )
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      const { email } = bundle.inputData
      const existingUser = await findUser(people, email)
      if (existingUser) {
        return existingUser
      }
      const body = {
        invitations: [{
          email,
          type: bundle.inputData.type
        }]
      }
      await people.inviteUser(body)
      const invitedUser = await findUser(people, email)
      if (invitedUser) {
        return invitedUser
      }
      throw new z.errors.Error("Could not find the invited user in the response.", "OperationFailed")
    },
    sample: samples.invitedUser
  }
}

// For the types that can't own rooms, DocSpace changes the type in the
// background and gives the rooms and shared files of the user to the caller.
const TYPES_WITHOUT_ROOMS = [
  "Guest",
  "User"
]
const TYPE_UPDATE_CHECKS = 40
const TYPE_UPDATE_DELAY = 500

/** @type {Record<string, string>} */
const USER_TYPES = {
  DocSpaceAdmin: "Full admin",
  Guest: "Guest",
  RoomAdmin: "Room admin",
  User: "User"
}

/**
 * Room admins can set User and Guest. Full admins can also set Room admin.
 * The owner can also set Full admin.
 * @param {User} user
 * @returns {Record<string, string>}
 */
function allowedUserTypes(user) {
  /** @type {Record<string, string>} */
  const choices = {}
  if (user.isOwner || user.isAdmin || user.isRoomAdmin) {
    choices.Guest = USER_TYPES.Guest
    choices.User = USER_TYPES.User
  }
  if (user.isOwner || user.isAdmin) {
    choices.RoomAdmin = USER_TYPES.RoomAdmin
  }
  if (user.isOwner) {
    choices.DocSpaceAdmin = USER_TYPES.DocSpaceAdmin
  }
  return choices
}

/**
 * @typedef {Object} ChangeUserTypeFields
 * @property {string} userId
 * @property {string} type
 */

const changeUserType = {
  display: {
    description: "Changes the type of a workspace user.",
    label: "Change User Type"
  },
  key: "changeUserType",
  noun: "User",
  operation: {
    inputFields: [
      {
        dynamic: "userAdded.id.displayName",
        key: "userId",
        label: "User",
        required: true,
        search: "searchUser.id",
        type: "string"
      },
      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<Object[]>}
       */
      async function (z, bundle) {
        const client = new Client(bundle.authData.baseUrl, z.request)
        const people = new PeopleService(client)
        const user = await people.self()
        const choices = allowedUserTypes(user)
        if (Object.keys(choices).length === 0) {
          return noRightsField("Only Room admins and Full admins can change user types.")
        }
        return [{
          choices,
          helpText: "Room admins and Full admins take a paid seat. " +
            "If the user becomes a User or a Guest, their rooms and shared files go to you.",
          key: "type",
          label: "User type",
          required: true,
          type: "string"
        }]
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, ChangeUserTypeFields>} bundle
     * @returns {Promise<User>}
     */
    async perform(z, bundle) {
      const { type, userId } = bundle.inputData
      if (!type) {
        throw new z.errors.Error(
          "Choose the user type. Only Room admins and Full admins can change it.",
          "InvalidData",
          400
        )
      }
      const client = new Client(bundle.authData.baseUrl, z.request)
      const people = new PeopleService(client)
      try {
        if (TYPES_WITHOUT_ROOMS.includes(type)) {
          let progress = await people.startUserTypeUpdate({ type, userId })
          let checks = 0
          while (!progress.isCompleted && !progress.error && checks < TYPE_UPDATE_CHECKS) {
            await new Promise((resolve) => setTimeout(resolve, TYPE_UPDATE_DELAY))
            progress = await people.userTypeUpdateProgress(userId)
            checks = checks + 1
          }
          if (progress.error) {
            throw new z.errors.Error(progress.error, "OperationFailed")
          }
          if (!progress.isCompleted) {
            throw new z.errors.Error("The user type is still being changed. Check the user later.", "Timeout", 408)
          }
        } else {
          await people.updateUserType(type, [userId])
        }
      } catch (error) {
        // DocSpace gives no clear message for these errors.
        const name = USER_TYPES[type] || type
        const status = responseStatus(error)
        if (status === 403) {
          throw new z.errors.Error(`You don't have the rights to make this user a ${name}.`, "Forbidden", 403)
        }
        if (status === 402) {
          throw new z.errors.Error(`The tariff has no free seat for one more ${name}.`, "PaymentRequired", 402)
        }
        throw error
      }
      return await people.user(userId)
    },
    sample: samples.user
  }
}

/**
 * @typedef {Object} UserStatusFields
 * @property {string} userId
 */

/**
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData, UserStatusFields>} bundle
 * @param {"Active"|"Terminated"} status
 * @returns {Promise<User>}
 */
async function setUserStatus(z, bundle, status) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const people = new PeopleService(client)
  const { userId } = bundle.inputData
  const users = await people.updateUserStatus(status, [userId])
  const user = users.find((item) => item.id === userId)
  if (!user) {
    throw new z.errors.Error("DocSpace didn't change the status of the user.", "OperationFailed")
  }
  return user
}

const disableUser = {
  display: {
    description: "Disables a workspace user. The user can't sign in until enabled again.",
    label: "Disable User"
  },
  key: "disableUser",
  noun: "User",
  operation: {
    inputFields: [
      {
        dynamic: "userAdded.id.displayName",
        helpText: "The owner of the workspace and you can't be disabled.",
        key: "userId",
        label: "User",
        required: true,
        search: "searchUser.id",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UserStatusFields>} bundle
     * @returns {Promise<User>}
     */
    perform(z, bundle) {
      return setUserStatus(z, bundle, "Terminated")
    },
    sample: { ...samples.user, status: 2 }
  }
}

const enableUser = {
  display: {
    description: "Enables a disabled workspace user.",
    label: "Enable User"
  },
  key: "enableUser",
  noun: "User",
  operation: {
    inputFields: [
      {
        dynamic: "disabledUsersList.id.displayName",
        key: "userId",
        label: "User",
        required: true,
        search: "searchUser.id",
        type: "string"
      }
    ],
    /**
     * @param {ZObject} z
     * @param {Bundle<SessionAuthenticationData, UserStatusFields>} bundle
     * @returns {Promise<User>}
     */
    perform(z, bundle) {
      return setUserStatus(z, bundle, "Active")
    },
    sample: samples.user
  }
}

module.exports = {
  changeUserType,
  disableUser,
  enableUser,
  inviteUser
}

