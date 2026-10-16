//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

// These tests use a fake `z` object, so they don't need a workspace.

const { equal, instance } = require("uvu/assert")
const { test } = require("uvu")
const { authData, fakeZ, RefreshAuthError } = require("../z.fixture.js")
const { sessionAuth } = require("./auth.js")

/**
 * @param {() => Promise<any>} fn
 * @returns {Promise<unknown>}
 */
async function caught(fn) {
  try {
    await fn()
  } catch (error) {
    return error
  }
}

test("asks zapier to sign in again when the session has expired", async () => {
  const z = fakeZ({ "GET /authentication": false })
  // @ts-ignore: a fake z object is enough.
  const error = await caught(() => sessionAuth.test(z, { authData }))
  instance(error, RefreshAuthError)
})

test("returns the current user when the session is valid", async () => {
  const user = { firstName: "John", lastName: "Doe" }
  const z = fakeZ({ "GET /authentication": true, "GET /people/@self": user })
  // @ts-ignore: a fake z object is enough.
  equal(await sessionAuth.test(z, { authData }), user)
})

test("rejects a workspace address without https", async () => {
  const z = fakeZ({})
  const bundle = { authData: { baseUrl: "http://example.onlyoffice.com", password: "p", username: "a@example.com" } }
  // @ts-ignore: a fake z object is enough.
  const error = await caught(() => sessionAuth.sessionConfig.perform(z, bundle))
  instance(error, Error)
  equal(z.calls.length, 0)
})

test("keeps www in the workspace address", async () => {
  const z = fakeZ({ "POST /authentication": { token: "t" } })
  const bundle = { authData: { baseUrl: "https://www.example.com/", password: "p", username: "a@example.com" } }
  // @ts-ignore: a fake z object is enough.
  const data = await sessionAuth.sessionConfig.perform(z, bundle)
  equal(data, { baseUrl: "https://www.example.com", sessionKey: "t" })
})

test.run()
