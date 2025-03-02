//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
const { sessionAuthContext, sessionAuthPerform, sessionAuthTest } = require("./auth.fixture.js")

const tester = createAppTester(App)

const Session = suite("session authentication", sessionAuthContext())

Session("authorizes the user", async (context) => {
  await sessionAuthPerform(tester, context)
  not.equal(context.authData.baseUrl, "")
  not.equal(context.authData.sessionKey, "")
})

Session("returns the user's data if they're authorized", async (context) => {
  const user = await sessionAuthTest(tester, context)
  if (!user) {
    unreachable("TODO")
    return
  }
  // See `sessionAuth.connectionLabel`.
  not.equal(user.firstName, "")
  not.equal(user.lastName, "")
})

Session.run()
