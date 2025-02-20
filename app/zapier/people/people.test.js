//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, not } = require("uvu/assert")
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
