//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { beforeSessionAuthRequest, isSameOrigin } = require("./auth.js")

const [appendSessionAuthHeader] = beforeSessionAuthRequest

/**
 * @param {string} url
 * @returns {Promise<HttpRequestOptions>}
 */
async function append(url) {
  const authData = {
    baseUrl: "https://example.onlyoffice.com",
    sessionKey: "secret"
  }
  // @ts-ignore: only the fields used by the middleware are needed.
  return appendSessionAuthHeader({ headers: {}, url }, {}, { authData })
}

test("is same origin for the workspace url", () => {
  equal(isSameOrigin("https://example.onlyoffice.com/api/2.0/files", "https://example.onlyoffice.com"), true)
})

test("is not same origin for another host", () => {
  equal(isSameOrigin("https://example.onlyoffice.com.evil.io/file", "https://example.onlyoffice.com"), false)
  equal(isSameOrigin("http://example.onlyoffice.com/file", "https://example.onlyoffice.com"), false)
})

test("is not same origin for invalid values", () => {
  equal(isSameOrigin("", "https://example.onlyoffice.com"), false)
  equal(isSameOrigin("not a url", "https://example.onlyoffice.com"), false)
  equal(isSameOrigin("https://example.onlyoffice.com", undefined), false)
})

test("appends the session key to workspace requests", async () => {
  const request = await append("https://example.onlyoffice.com/api/2.0/files/@my")
  equal(request.headers?.Authorization, "secret")
})

test("does not append the session key to third-party requests", async () => {
  const request = await append("https://files.example.com/report.docx")
  equal(request.headers?.Authorization, undefined)
})

test.run()
