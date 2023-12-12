//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { not, unreachable } = require("uvu/assert")
const { suite } = require("uvu")
const { createAppTester } = require("zapier-platform-core")
const { App } = require("./app.js")
const { sessionAuthContext, sessionAuthPerform } = require("./auth.fixture.js")
const { userAdded } = require("./people.js")

const tester = createAppTester(App)

const People = suite("people", {
  ...sessionAuthContext(),
  inputData: {
    folderId: 0
  }
})

People.before(async (context) => {
  await sessionAuthPerform(tester, context)
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
