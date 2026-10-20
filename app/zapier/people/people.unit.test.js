//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// These tests use a fake `z` object, so they don't need a workspace.

const { equal, instance } = require("uvu/assert")
const { test } = require("uvu")
const { authData, fakeZ, HaltedError } = require("../z.fixture.js")
const {
  changeUserType,
  inviteUser
} = require("./actions.js")
const { searchUser } = require("./searches.js")
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

test("finds a user by email", async () => {
  const user = { email: "john@example.com", id: "u1" }
  const z = fakeZ({ "GET /people/email": (call) => (call.query.email === user.email ? user : null) })
  // @ts-ignore: a fake z object is enough.
  equal(await searchUser.operation.perform(z, { authData, inputData: { email: user.email } }), [user])
})

test("finds no user if the email is unknown", async () => {
  const z = fakeZ({})
  // @ts-ignore: a fake z object is enough.
  equal(await searchUser.operation.perform(z, { authData, inputData: { email: "nobody@example.com" } }), [])
})

test("changes a user to a paid type at once", async () => {
  const user = { id: "u1", isRoomAdmin: true }
  const z = fakeZ({
    "GET /people/u1": user,
    "PUT /people/type/RoomAdmin": [user]
  })
  const inputData = { type: "RoomAdmin", userId: "u1" }
  // @ts-ignore: a fake z object is enough.
  const result = await changeUserType.operation.perform(z, { authData, inputData })
  equal(result, user)
  equal(z.calls[0].body, { userIds: ["u1"] })
})

test("changes a user to a guest in the background", async () => {
  const user = { id: "u1", isVisitor: true }
  const z = fakeZ({
    "GET /people/type/progress/u1": { error: "", isCompleted: true, percentage: 100 },
    "GET /people/u1": user,
    "POST /people/type": { error: "", isCompleted: false, percentage: 10 }
  })
  const inputData = { type: "Guest", userId: "u1" }
  // @ts-ignore: a fake z object is enough.
  const result = await changeUserType.operation.perform(z, { authData, inputData })
  equal(result, user)
  equal(z.calls[0].body, { type: "Guest", userId: "u1" })
  equal(z.calls[1].path, "/people/type/progress/u1")
})

test("fails changing the user type with an error", async () => {
  const z = fakeZ({ "POST /people/type": { error: "Access denied", isCompleted: true, percentage: 100 } })
  const inputData = { type: "User", userId: "u1" }
  try {
    // @ts-ignore: a fake z object is enough.
    await changeUserType.operation.perform(z, { authData, inputData })
    throw new Error("Expected an error")
  } catch (error) {
    instance(error, HaltedError)
  }
})

test.run()
