//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { equal, instance } = require("uvu/assert")
const { test } = require("uvu")
const { fileName, isZapierUrl, Uploader } = require("./uploader.js")
const { RefreshAuthError, ZapierError } = require("../z.fixture.js")

test("recognizes zapier urls by the host", () => {
  equal(isZapierUrl("https://zapier.com/engine/hydrate/1/abc/"), true)
  equal(isZapierUrl("https://hooks.zapier.com/file"), true)
})

test("does not trust other hosts that start with zapier", () => {
  equal(isZapierUrl("https://zapier.example.com/file"), false)
  equal(isZapierUrl("https://zapier-files.example.com/file"), false)
  equal(isZapierUrl("https://example.com/zapier.com"), false)
  equal(isZapierUrl("http://zapier.com/file"), false)
  equal(isZapierUrl("not a url"), false)
})

test("takes the file name from the content disposition", () => {
  equal(fileName("https://example.com/a", "attachment; filename=\"Report.pdf\"", "application/pdf"), "Report.pdf")
})

test("takes the file name from the url", () => {
  equal(fileName("https://example.com/files/My%20Report.xlsx?x=1", null, null), "My Report.xlsx")
})

test("picks the extension by the content type", () => {
  equal(fileName("https://example.com/download", null, "application/pdf"), "File from Zapier.pdf")
  equal(fileName("https://example.com/download", null, "image/png; charset=binary"), "File from Zapier.png")
  equal(fileName("https://example.com/download", null, "application/octet-stream"), "File from Zapier")
  equal(fileName("https://example.com/download", null, null), "File from Zapier.docx")
})

/**
 * @param {number} status
 * @param {string} body
 * @returns {{calls: number, restore: () => void}}
 */
function mockFetch(status, body) {
  const original = globalThis.fetch
  const state = {
    calls: 0,
    restore() {
      globalThis.fetch = original
    }
  }
  // @ts-ignore: only the fields used by the uploader are needed.
  globalThis.fetch = async () => {
    state.calls += 1
    return new Response(body, { status })
  }
  return state
}

test("doesn't ask to reconnect the account when the file URL refuses access", async () => {
  const z = {
    errors: { Error: ZapierError, RefreshAuthError },
    request: () => Promise.reject(new RefreshAuthError()),
    stashFile: (/** @type {Promise<unknown>} */ promise) => promise
  }
  // @ts-ignore: a fake z object is enough.
  const uploader = new Uploader(z)
  try {
    await uploader.stash("https://example.com/private.docx")
    throw new Error("Expected an error")
  } catch (error) {
    instance(error, ZapierError)
  }
})

test("reads chunks with range requests", async () => {
  const state = mockFetch(206, "abcd")
  try {
    // @ts-ignore: z isn't used for reading.
    const uploader = new Uploader({})
    /** @type {import("./uploader.js").BodyUpload} */
    const body = { fileName: "a.txt", fileSize: 8, fileStash: "https://example.com/a" }
    equal((await uploader.readChunk(body, 0, 4)).toString(), "abcd")
    equal(body.data, undefined)
  } finally {
    state.restore()
  }
})

test("slices the whole file if the server ignores the range", async () => {
  const state = mockFetch(200, "abcdef")
  try {
    // @ts-ignore: z isn't used for reading.
    const uploader = new Uploader({})
    /** @type {import("./uploader.js").BodyUpload} */
    const body = { fileName: "a.txt", fileSize: 6, fileStash: "https://example.com/a" }
    equal((await uploader.readChunk(body, 0, 4)).toString(), "abcd")
    equal((await uploader.readChunk(body, 4, 4)).toString(), "ef")
    equal(state.calls, 1)
  } finally {
    state.restore()
  }
})

test.run()
