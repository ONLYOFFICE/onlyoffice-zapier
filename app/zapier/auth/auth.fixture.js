//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { env } = require("node:process")
const { sessionAuth } = require("./auth.js")

/**
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationFields} SessionAuthenticationFields
 * @typedef {import("../../docspase/auth/auth.js").SessionAuthenticationUnapprovedData} SessionAuthenticationUnapprovedData
 * @typedef {import("../../docspase/people/people.js").User} User
 */

const DOC_SPACE_BASE_URL = env.DOC_SPACE_BASE_URL || ""
const DOC_SPACE_USERNAME = env.DOC_SPACE_USERNAME || ""
const DOC_SPACE_PASSWORD = env.DOC_SPACE_PASSWORD || ""

/**
 * @typedef {Object} AuthenticationContext
 * @property {SessionAuthenticationData} authData
 */

/**
 * @typedef {ReturnType<createAppTester>} AuthenticationTester
 */

/**
 * @returns {AuthenticationContext}
 */
function sessionAuthContext() {
  return {
    authData: {
      baseUrl: "",
      sessionKey: ""
    }
  }
}

/**
 * @param {AuthenticationTester} tester
 * @param {AuthenticationContext} context
 * @returns {Promise<void>}
 */
async function sessionAuthPerform(tester, context) {
  const { perform } = sessionAuth.sessionConfig
  /** @type {SessionAuthenticationFields} */
  const authData = {
    baseUrl: DOC_SPACE_BASE_URL,
    username: DOC_SPACE_USERNAME,
    password: DOC_SPACE_PASSWORD
  }
  const bundle = { authData }
  const data = await tester(perform, bundle)
  context.authData.baseUrl = data.baseUrl
  context.authData.sessionKey = data.sessionKey
}

/**
 * @param {AuthenticationTester} tester
 * @param {AuthenticationContext} context
 * @returns {Promise<User | undefined>}
 */
async function sessionAuthTest(tester, context) {
  const { test } = sessionAuth
  /** @type {SessionAuthenticationUnapprovedData} */
  const authData = {
    baseUrl: context.authData.baseUrl,
    sessionKey: context.authData.sessionKey
  }
  const bundle = { authData }
  return tester(test, bundle)
}

module.exports = {
  sessionAuthContext,
  sessionAuthPerform,
  sessionAuthTest
}
