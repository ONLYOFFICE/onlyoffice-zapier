//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const crypto = require("crypto")
const { Client, isNotFoundError, normalizeId, responseStatus } = require("../../docspace/client/client.js")
const { FilesService } = require("../../docspace/files/files.js")
const { WebhooksService } = require("../../docspace/webhooks/webhooks.js")

/**
 * @typedef {import("../../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("../../docspace/webhooks/webhooks.js").WebhookSubscriptionData} WebhookSubscriptionData
 * @typedef {import("../../docspace/files/files.js").FileData} FileData
 * @typedef {import("../../docspace/files/files.js").FolderData} FolderData
 * @typedef {import("../../docspace/files/files.js").RoomData} RoomData
 * @typedef {import("../../docspace/people/people.js").User} User
 */

/**
 * @typedef {FileData | FolderData | RoomData | User} WebhookEventData
 */

/**
 * @typedef {Object} WebhookTriggerOperation
 * @property {Object[]} inputFields
 * @property {function(ZObject, Bundle<SessionAuthenticationData>): Promise<WebhookEventData[]>} perform
 * @property {function(ZObject, Bundle<SessionAuthenticationData>): Promise<WebhookEventData[]>} [performList]
 * @property {function(ZObject, Bundle<SessionAuthenticationData>): Promise<WebhookSubscriptionData>} performSubscribe
 * @property {function(ZObject, Bundle<SessionAuthenticationData>): Promise<void>} performUnsubscribe
 * @property {Object} sample
 * @property {string} type
 */

/**
 * @typedef {Object} WebhookTrigger
 * @property {Object} display
 * @property {string} display.description
 * @property {string} display.label
 * @property {string} key
 * @property {string} noun
 * @property {WebhookTriggerOperation} operation
 */

// DocSpace passwords have at most 30 characters, and the minimum length of the
// password policy can't be more. So a key of 30 characters fits any policy.
const SECRET_KEY_LENGTH = 30

const SECRET_KEY_CHARACTER_SETS = [
  "abcdefghijklmnopqrstuvwxyz",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "0123456789",
  "!#$%&*+-=?@^_"
]

/**
 * @param {string} chars
 * @returns {string}
 */
function randomChar(chars) {
  return chars[crypto.randomInt(chars.length)]
}

/**
 * Generates a random secret key. DocSpace checks it with the password policy,
 * so the key always has lowercase and uppercase letters, digits and special
 * characters.
 * @returns {string}
 */
function generateSecretKey() {
  const all = SECRET_KEY_CHARACTER_SETS.join("")
  const chars = SECRET_KEY_CHARACTER_SETS.map((set) => randomChar(set))
  while (chars.length < SECRET_KEY_LENGTH) {
    chars.push(randomChar(all))
  }
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1)
    const char = chars[i]
    chars[i] = chars[j]
    chars[j] = char
  }
  return chars.join("")
}

const SIGNATURE_HEADER = "x-docspace-signature-256"

/**
 * Finds a header of the webhook request. Zapier adds the `Http-` prefix to the
 * headers and changes their case, so the search ignores both.
 * @param {Record<string, string> | undefined} headers
 * @param {string} name
 * @returns {string | undefined}
 */
function findHeader(headers, name) {
  if (!headers) {
    return
  }
  const expected = name.toLowerCase()
  const key = Object.keys(headers).find((item) => (
    item.toLowerCase().replace(/^http-/, "") === expected
  ))
  if (key) {
    return headers[key]
  }
}

/**
 * Validate webhook signature
 * @param {string} payload
 * @param {string} signature
 * @param {string} secret
 * @returns {boolean}
 */
function validateWebhookSignature(payload, signature, secret) {
  const expectedHash = crypto
    .createHmac("sha256", Buffer.from(secret, "utf8"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
    .toUpperCase()

  const expectedSignature = `sha256=${expectedHash}`
  const separator = signature.indexOf("=")
  const prefix = signature.substring(0, separator).trim().toLowerCase()
  const hash = signature.substring(separator + 1).trim().toUpperCase()
  const actualSignature = `${prefix}=${hash}`

  try {
    return crypto.timingSafeEqual(
      Buffer.from(actualSignature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

/**
 * Builds the trigger bitmask. Some flags don't fit in 32 bits (for example,
 * `agent.created` is 2^31), so the bitwise OR can't be used. The flags are
 * different powers of two, so their sum gives the same result.
 * @param {number[]} eventIds
 * @returns {number}
 */
function triggersMask(eventIds) {
  return [...new Set(eventIds)].reduce((mask, id) => mask + id, 0)
}

/**
 * Subscribe to webhook
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @param {number[]} eventIds
 * @returns {Promise<WebhookSubscriptionData>}
 */
async function subscribeWebhook(z, bundle, eventIds) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const webhooks = new WebhooksService(client)

  const secretKey = generateSecretKey()

  const targetUrl = bundle.targetUrl || ""
  // Generate short name (max 50 chars)
  const timestamp = Date.now().toString(36)
  const name = `Zapier-${timestamp}`

  const triggers = triggersMask(eventIds)

  const subscription = await webhooks.createWebhook({
    enabled: true,
    name,
    secretKey,
    ssl: true,
    triggers,
    uri: targetUrl
  })

  return {
    ...subscription,
    secretKey
  }
}

/**
 * Unsubscribe from webhook
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {Promise<void>}
 */
async function unsubscribeWebhook(z, bundle) {
  const client = new Client(bundle.authData.baseUrl, z.request)
  const webhooks = new WebhooksService(client)

  if (bundle.subscribeData && bundle.subscribeData.id) {
    try {
      await webhooks.deleteWebhook(Number(bundle.subscribeData.id))
    } catch (error) {
      // DocSpace can remove a webhook by itself, for example, when the target
      // responds with 410 Gone.
      if (!isNotFoundError(error)) {
        throw error
      }
    }
  }
}

/**
 * @typedef {Object} WebhookFilters
 * @property {number=} rootFolderType
 * @property {string=} entryField The input field with the id of the entry
 * itself: a room, or a form (the original form of a submitted form).
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isSet(value) {
  return value !== undefined && value !== null && value !== ""
}

/**
 * A webhook sends the internal DocSpace entry, which has other fields than the
 * API response that polling returns. Request the API response, so that both
 * return the same fields. If the entry is deleted or the user has no access to
 * it, return the webhook payload.
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @param {string | undefined} trigger
 * @param {any} payload
 * @returns {Promise<any>}
 */
async function fetchEntry(z, bundle, trigger, payload) {
  // A submitted form has two entries: the filled copy and the original form.
  if (payload.submittedForm) {
    const form = await fetchEntry(z, bundle, "file", payload.submittedForm)
    if (payload.originalForm) {
      form.originalForm = await fetchEntry(z, bundle, "file", payload.originalForm)
    }
    return form
  }
  if (!trigger || !isSet(payload.id)) {
    return payload
  }
  const client = new Client(bundle.authData.baseUrl, z.request)
  const files = new FilesService(client)
  const type = trigger.split(".")[0]
  try {
    if (type === "file") {
      return await files.fileInfo(payload.id)
    }
    if (type === "folder") {
      return await files.folderInfo(payload.id)
    }
    if (type === "room") {
      return await files.roomInfo(payload.id)
    }
  } catch (error) {
    // Other errors, like an expired session, must fail the run.
    const status = responseStatus(error)
    if (status === 403 || status === 404) {
      return payload
    }
    throw error
  }
  return payload
}

/**
 * Handle webhook request
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @param {WebhookFilters} [filters]
 * @param {function(any): any} [normalize]
 * @returns {Promise<WebhookEventData[]>}
 */
async function performWebhook(z, bundle, filters = {}, normalize) {
  const subscribeData = /** @type {WebhookSubscriptionData} */ (/** @type {unknown} */ (bundle.subscribeData))
  // DocSpace sends an empty request when it checks the address of a new
  // webhook. It has no event, so there is nothing to check or return.
  if (bundle.rawRequest && !bundle.rawRequest.content) {
    return []
  }
  if (subscribeData && subscribeData.secretKey) {
    const signature = findHeader(bundle.rawRequest?.headers, SIGNATURE_HEADER)
    const rawBody = bundle.rawRequest?.content

    const isValid = !!signature && rawBody !== undefined && validateWebhookSignature(
      rawBody,
      signature,
      subscribeData.secretKey
    )

    if (!isValid) {
      throw new z.errors.Error("Invalid webhook signature", "InvalidSignature", 401)
    }
  }

  const webhookBody = bundle.cleanedRequest
  const trigger = webhookBody.event && webhookBody.event.trigger
  const inputData = bundle.inputData || {}

  // The filters use the webhook payload, because it keeps the place of the
  // entry before the event. For example, the API response of a file moved to
  // the trash from a room doesn't have the room anymore.
  const payload = webhookBody.payload || webhookBody
  // The filters of a submitted form use the original form.
  const entry = payload.originalForm || payload

  // Filter by rootFolderType
  if (filters.rootFolderType !== undefined) {
    if (
      entry.rootFolderType === undefined ||
      Number(entry.rootFolderType) !== Number(filters.rootFolderType)
    ) {
      return []
    }
  }

  if (filters.entryField && isSet(inputData[filters.entryField])) {
    if (String(entry.id) !== String(inputData[filters.entryField])) {
      return []
    }
  }

  // Like polling, the trigger fires only for direct children of the selected
  // folder, or of the room if no folder is selected.
  const expectedParentId = isSet(inputData.folderId) ? inputData.folderId : inputData.id
  if (isSet(expectedParentId)) {
    if (!isSet(entry.parentId) || String(entry.parentId) !== String(expectedParentId)) {
      return []
    }
  }

  const event = await fetchEntry(z, bundle, trigger, payload)
  const result = normalize ? normalize(event) : event

  // Convert numeric ids to numbers for Zapier deduplication
  if (result.id !== undefined) {
    result.id = normalizeId(result.id)
  }

  return [result]
}

/**
 * Create webhook trigger
 * @param {string} key
 * @param {string} label
 * @param {string} description
 * @param {number[]} eventIds
 * @param {Object} options
 * @param {Object[]=} options.inputFields
 * @param {WebhookTriggerOperation["performList"]} [options.pollingFallback]
 * @param {Object=} options.sample
 * @param {string=} options.noun
 * @param {WebhookFilters=} options.filters
 * @param {function(any): any=} options.normalize
 * @returns {WebhookTrigger}
 */
function createWebhookTrigger(key, label, description, eventIds, options = {}) {
  return {
    display: {
      description,
      label
    },
    key,
    noun: options.noun || "Event",
    operation: {
      inputFields: options.inputFields || [],

      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<WebhookEventData[]>}
       */
      perform: (z, bundle) => {
        return performWebhook(z, bundle, options.filters, options.normalize)
      },

      performList: options.pollingFallback,

      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<WebhookSubscriptionData>}
       */
      performSubscribe: async (z, bundle) => {
        return await subscribeWebhook(z, bundle, eventIds)
      },

      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<void>}
       */
      performUnsubscribe: async (z, bundle) => {
        return await unsubscribeWebhook(z, bundle)
      },

      sample: options.sample || {},

      type: "hook"
    }
  }
}

module.exports = {
  createWebhookTrigger,
  findHeader,
  generateSecretKey,
  performWebhook,
  subscribeWebhook,
  triggersMask,
  unsubscribeWebhook,
  validateWebhookSignature
}
