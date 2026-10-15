//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// These tests use a fake `z` object, so they don't need a workspace.

const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { authData, fakeZ } = require("../z.fixture.js")
const { inviteUser } = require("./actions.js")
const { userAdded } = require("./triggers.js")

test("returns an existing user without inviting them again", async () => {
  const user = { displayName: "John Doe", email: "john@example.com", id: "u1" }
  const z = fakeZ({ "GET /people/email": user })
  const inputData = { email: "john@example.com", type: "4" }
  // @ts-ignore: a fake z object is enough.
  const result = await inviteUser.operation.perform(z, { authData, inputData })
  equal(result, user)
  equal(z.calls.map((call) => `${call.method} ${call.path}`), ["GET /people/email"])
})

test("invites a new user and returns them", async () => {
  let invited = false
  const user = { displayName: "new@example.com", email: "new@example.com", id: "u2" }
  const z = fakeZ({
    "GET /people/email": () => {
      if (!invited) {
        throw new Error(JSON.stringify({ status: 404 }))
      }
      return user
    },
    "POST /people/invite": () => {
      invited = true
      return []
    }
  })
  const inputData = { email: "new@example.com", type: "4" }
  // @ts-ignore: a fake z object is enough.
  const result = await inviteUser.operation.perform(z, { authData, inputData })
  equal(result, user)
  equal(z.calls[1].body, { invitations: [{ email: "new@example.com", type: "4" }] })
})

test("requests users page by page", async () => {
  const z = fakeZ({ "GET /people": [] })
  // @ts-ignore: a fake z object is enough.
  await userAdded.operation.perform(z, { authData, inputData: {}, meta: { page: 1 } })
  equal(z.calls[0].query, { count: "100", startIndex: "100" })
})

test.run()
