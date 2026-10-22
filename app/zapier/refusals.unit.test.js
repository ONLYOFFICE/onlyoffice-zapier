//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { equal, match } = require("uvu/assert")
const { test } = require("uvu")
const { authData, fakeZ, ZapierError } = require("./z.fixture.js")
const { afterResponse } = require("./refusals.js")

const [explainRefusal] = afterResponse

/**
 * @param {number} status
 * @param {string} url
 * @param {any} data
 * @returns {any}
 */
function response(status, url, data) {
  return { data, request: { url }, skipThrowForStatus: false, status }
}

/**
 * @param {any} res
 * @returns {unknown}
 */
function run(res) {
  try {
    // @ts-ignore: a fake z object is enough.
    return explainRefusal(res, fakeZ({}), { authData })
  } catch (error) {
    return error
  }
}

test("explains a refusal of the workspace", () => {
  const error = run(response(403, `${authData.baseUrl}/api/2.0/files/rooms/5/archive`, {
    error: { message: "Access denied" }
  }))
  equal(error instanceof ZapierError, true)
  match(String(error), "The workspace refused the request (Access denied)")
})

test("explains a limit of the tariff", () => {
  const error = run(response(402, `${authData.baseUrl}/api/2.0/files/rooms`, {
    error: { message: "The number of rooms should not exceed 12" }
  }))
  match(String(error), "The tariff of the workspace doesn't allow the request (The number of rooms")
})

test("leaves other responses and other hosts alone", () => {
  const ok = response(200, `${authData.baseUrl}/api/2.0/files/rooms`, {})
  equal(run(ok), ok)
  const notFound = response(404, `${authData.baseUrl}/api/2.0/files/file/1`, {})
  equal(run(notFound), notFound)
  const external = response(403, "https://example.org/file.docx", {})
  equal(run(external), external)
})

test.run()
