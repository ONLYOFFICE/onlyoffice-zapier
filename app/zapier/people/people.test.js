//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
const { inviteUser } = require("./actions.js")
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

People("invites a user", async (context) => {
  const { perform } = inviteUser.operation
  /** @type {InviteUserFields} */
  const inputData = {
    email: "whatever@onlyoffice.io",
    type: "2"
  }
  const bundle = {
    authData: context.authData,
    inputData
  }
  try {
    const user = await tester(perform, bundle)
    if (!user) {
      unreachable("TODO")
      return
    }
    context.inputData.userId = user.id
    equal(user.displayName, bundle.inputData.email)
  } catch (error) {
    if (!(error instanceof Error && error.message)) {
      unreachable("Expected an error but got something else.")
      return
    }

    const response = JSON.parse(error.message)
    if (!response.content) {
      unreachable("Expected a content but did not get it.")
      return
    }

    const data = JSON.parse(response.content)
    const message = data.error.message
    equal(message, "A user with this email is already registered.")
  }
})

People("triggers when a user is added", async (context) => {
  const { perform } = userAdded.operation
  const bundle = {
    authData: context.authData
  }
  const users = await tester(perform, bundle)
  const user = users[0]
  if (!user) {
    unreachable("TODO")
    return
  }
  not.equal(user.id, 0)
})

People.run()
