//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, not } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
const {
  changeUserType,
  inviteUser
} = require("./actions.js")
const { searchUser } = require("./searches.js")
const { sessionAuthContext, sessionAuthPerform } = require("../auth/auth.fixture.js")
const { userAdded } = require("./triggers.js")

/**
 * @typedef {import("./actions.js").InviteUserFields} InviteUserFields
 */

const tester = createAppTester(App)

const People = suite("people", {
  ...sessionAuthContext(),
  inputData: {
    userId: ""
  }
})

People.before(async (context) => {
  await sessionAuthPerform(tester, context)
})

People("invited a user", async (context) => {
  const { perform } = inviteUser.operation
  /** @type {InviteUserFields} */
  const inputData = {
    email: "whatever@onlyoffice.io",
    type: "4"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const user = await tester(perform, bundle)
  context.inputData.userId = user.id
  equal(user.displayName, bundle.inputData.email)
})

People("returns an invited user without inviting them again", async (context) => {
  const { perform } = inviteUser.operation
  /** @type {InviteUserFields} */
  const inputData = {
    email: "whatever@onlyoffice.io",
    type: "4"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  const user = await tester(perform, bundle)
  equal(user.id, context.inputData.userId)
})

People("finds the invited user by email", async (context) => {
  const { perform } = searchUser.operation
  const bundle = {
    authData: context.authData,
    inputData: {
      email: "whatever@onlyoffice.io"
    }
  }
  const users = await tester(perform, bundle)
  equal(users[0].id, context.inputData.userId)
})

People("changes the type of the invited user and back", async (context) => {
  const { perform } = changeUserType.operation
  const roomAdmin = await tester(perform, {
    authData: context.authData,
    inputData: { type: "RoomAdmin", userId: context.inputData.userId }
  })
  equal(roomAdmin.isRoomAdmin, true)
  const user = await tester(perform, {
    authData: context.authData,
    inputData: { type: "User", userId: context.inputData.userId }
  })
  equal(user.isRoomAdmin, false)
  equal(user.isCollaborator, true)
})

People("triggers when a user is added", async (context) => {
  const { perform } = userAdded.operation
  const bundle = {
    authData: context.authData
  }
  const users = await tester(perform, bundle)
  const user = users[0]
  not.equal(user.id, context.inputData.userId)
})

People.run()
