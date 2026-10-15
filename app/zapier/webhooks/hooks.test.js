//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const crypto = require("crypto")
const { equal, throws } = require("uvu/assert")
const { test } = require("uvu")
const {
  findHeader,
  generateSecretKey,
  performWebhook,
  triggersMask,
  validateWebhookSignature
} = require("./hooks.js")

const SECRET = "secret"

/**
 * @param {string} body
 * @returns {string}
 */
function sign(body) {
  const hash = crypto.createHmac("sha256", SECRET).update(body).digest("hex")
  return `sha256=${hash.toUpperCase()}`
}

/** @type {Record<string, Object>} */
const responses = {}

const z = {
  errors: {
    Error: class extends Error {}
  },
  /**
   * @param {{url: string}} request
   * @returns {Promise<Object>}
   */
  async request(request) {
    const path = new URL(request.url).pathname
    if (!responses[path]) {
      throw new Error(JSON.stringify({ status: 404 }))
    }
    if (typeof responses[path] === "number") {
      throw new Error(JSON.stringify({ status: responses[path] }))
    }
    return { data: { response: responses[path], status: 0 } }
  }
}

/**
 * @param {Object} body
 * @param {Record<string, string>} headers
 * @returns {any}
 */
function hookBundle(body, headers) {
  return {
    authData: {
      baseUrl: "https://example.onlyoffice.com",
      sessionKey: "key"
    },
    cleanedRequest: body,
    inputData: {},
    rawRequest: {
      content: JSON.stringify(body),
      headers
    },
    subscribeData: {
      id: 1,
      secretKey: SECRET
    }
  }
}

test("generates a secret key that satisfies a strict password policy", () => {
  for (let i = 0; i < 100; i += 1) {
    const key = generateSecretKey()
    equal(key.length, 30)
    equal(/[a-z]/.test(key), true)
    equal(/[A-Z]/.test(key), true)
    equal(/[0-9]/.test(key), true)
    equal(/[^a-zA-Z0-9]/.test(key), true)
    equal(/\s/.test(key), false)
  }
})

test("builds a trigger mask above 32 bits", () => {
  const files = [
    128,
    256
  ]
  const duplicates = [
    128,
    128
  ]
  const large = [
    2 ** 31,
    2 ** 34,
    1
  ]
  equal(triggersMask(files), 384)
  equal(triggersMask(duplicates), 128)
  equal(triggersMask(large), 2 ** 31 + 2 ** 34 + 1)
})

test("finds a header with the Zapier prefix", () => {
  equal(findHeader({ "Http-X-Docspace-Signature-256": "a" }, "x-docspace-signature-256"), "a")
  equal(findHeader({ "x-docspace-signature-256": "b" }, "x-docspace-signature-256"), "b")
  equal(findHeader({ "Http-Content-Type": "c" }, "x-docspace-signature-256"), undefined)
  equal(findHeader(undefined, "x-docspace-signature-256"), undefined)
})

test("validates a signature regardless of the hex case", () => {
  const body = "{\"a\":1}"
  equal(validateWebhookSignature(body, sign(body), SECRET), true)
  equal(validateWebhookSignature(body, sign(body).toLowerCase(), SECRET), true)
  equal(validateWebhookSignature(body, sign("{}"), SECRET), false)
})

test("accepts a webhook with a valid signature", async () => {
  const body = { event: { trigger: "room.created" }, payload: { id: 1, roomType: 2 } }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) })
  // @ts-ignore: a partial z object is enough.
  const result = await performWebhook(z, bundle)
  equal(result.length, 1)
})

test("keeps guid ids and converts numeric ids", async () => {
  const guid = "11111111-2222-3333-4444-555555555555"
  const userBody = { event: { trigger: "user.created" }, payload: { id: guid } }
  const userBundle = hookBundle(userBody, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(userBody)) })
  // @ts-ignore: a partial z object is enough.
  const users = await performWebhook(z, userBundle)
  equal(users[0].id, guid)

  const roomBody = { event: { trigger: "room.created" }, payload: { id: "15", roomType: 2 } }
  const roomBundle = hookBundle(roomBody, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(roomBody)) })
  // @ts-ignore: a partial z object is enough.
  const rooms = await performWebhook(z, roomBundle)
  equal(rooms[0].id, 15)
})

test("returns the api dto instead of the webhook payload", async () => {
  responses["/api/2.0/files/file/5"] = {
    folderId: 3,
    id: 5,
    rootFolderType: 14,
    title: "Report.docx",
    webUrl: "https://example.onlyoffice.com/doceditor?fileid=5"
  }
  const payload = { id: 5, parentId: 3, rootFolderType: 14, title: "Report.docx" }
  const body = { event: { trigger: "file.created" }, payload }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) })
  // @ts-ignore: a partial z object is enough.
  const files = await performWebhook(z, bundle, { rootFolderType: 14 })
  equal(files.length, 1)
  const file = /** @type {import("../../docspace/files/files.js").FileData} */ (files[0])
  equal(file.webUrl, "https://example.onlyoffice.com/doceditor?fileid=5")
})

test("returns the webhook payload if the dto is not available", async () => {
  const body = { event: { trigger: "file.deleted" }, payload: { id: 6, parentId: 3 } }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) })
  // @ts-ignore: a partial z object is enough.
  const files = await performWebhook(z, bundle)
  equal(files[0], { id: 6, parentId: 3 })

  responses["/api/2.0/files/file/11"] = 403
  const forbiddenBody = { event: { trigger: "file.created" }, payload: { id: 11, parentId: 3 } }
  const forbidden = hookBundle(forbiddenBody, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(forbiddenBody)) })
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, forbidden))[0], { id: 11, parentId: 3 })
})

test("fails if the dto request fails for other reasons", async () => {
  responses["/api/2.0/files/file/10"] = 401
  const body = { event: { trigger: "file.created" }, payload: { id: 10, parentId: 3 } }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) })
  // @ts-ignore: a partial z object is enough.
  await rejects(() => performWebhook(z, bundle))
})

test("filters events by the parent folder or room", async () => {
  responses["/api/2.0/files/file/7"] = { folderId: 3, id: 7, rootFolderType: 14, title: "a.docx" }
  const body = { event: { trigger: "file.created" }, payload: { id: 7, parentId: 3 } }
  const headers = { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) }

  const inRoom = hookBundle(body, headers)
  inRoom.inputData = { id: 3 }
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, inRoom)).length, 1)

  const inFolder = hookBundle(body, headers)
  inFolder.inputData = { folderId: "3", id: 1 }
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, inFolder)).length, 1)

  const elsewhere = hookBundle(body, headers)
  elsewhere.inputData = { id: 4 }
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, elsewhere)).length, 0)
})

test("filters trashed entries by their original folder", async () => {
  responses["/api/2.0/files/file/8"] = { folderId: 100, id: 8, originId: 100, rootFolderType: 3, title: "a.docx" }
  const body = { event: { trigger: "file.trashed" }, payload: { id: 8, parentId: 3, rootFolderType: 14 } }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) })
  bundle.inputData = { folderId: 3 }
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, bundle)).length, 1)
})

test("skips entries trashed from a room in the files section", async () => {
  responses["/api/2.0/files/file/9"] = { folderId: 5070, id: 9, originId: 5070, rootFolderType: 3, title: "a.docx" }
  const body = { event: { trigger: "file.trashed" }, payload: { id: 9, parentId: 3, rootFolderType: 14 } }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign(JSON.stringify(body)) })
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, bundle, { rootFolderType: 5 })).length, 0)
  // @ts-ignore: a partial z object is enough.
  equal((await performWebhook(z, bundle, { rootFolderType: 14 })).length, 1)
})

test("rejects a webhook with an invalid signature", async () => {
  const body = { event: { trigger: "room.created" }, payload: { id: 1 } }
  const bundle = hookBundle(body, { "Http-X-Docspace-Signature-256": sign("{}") })
  // @ts-ignore: a partial z object is enough.
  await rejects(() => performWebhook(z, bundle))
})

test("rejects a webhook without a signature", async () => {
  const body = { event: { trigger: "room.created" }, payload: { id: 1 } }
  const bundle = hookBundle(body, {})
  // @ts-ignore: a partial z object is enough.
  await rejects(() => performWebhook(z, bundle))
})

test("ignores an empty request", async () => {
  const bundle = hookBundle({}, {})
  bundle.rawRequest.content = ""
  // @ts-ignore: a partial z object is enough.
  equal(await performWebhook(z, bundle), [])
})

/**
 * @param {() => any} fn
 * @returns {Promise<void>}
 */
async function rejects(fn) {
  /** @type {unknown} */
  let error
  try {
    await fn()
  } catch (e) {
    error = e
  }
  throws(() => {
    if (error) {
      throw error
    }
  })
}

test.run()
