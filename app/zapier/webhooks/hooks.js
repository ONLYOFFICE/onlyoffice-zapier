//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const crypto = require("crypto")
const { Client } = require("../../docspace/client/client.js")
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
 * @property {function(ZObject, Bundle<SessionAuthenticationData>): WebhookEventData[]} perform
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

/**
 * Generate random secret key
 * Requirements: 8-30 chars, only latin letters, no spaces
 * @returns {string}
 */
function generateSecretKey() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const length = 24
  let result = ""
  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i += 1) {
    result += chars[randomBytes[i] % chars.length]
  }
  return result
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

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
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

  const subscription = await webhooks.createWebhook({
    enabled: true,
    eventIds,
    name,
    secretKey,
    ssl: true,
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
    await webhooks.deleteWebhook(Number(bundle.subscribeData.id))
  }
}

/**
 * Handle webhook request
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {WebhookEventData[]}
 */
function performWebhook(z, bundle) {
  const subscribeData = /** @type {WebhookSubscriptionData} */ (/** @type {unknown} */ (bundle.subscribeData))
  if (subscribeData && subscribeData.secretKey) {
    const signature = bundle.rawRequest?.headers?.["x-docspace-signature-256"]
    const rawBody = bundle.rawRequest?.content

    if (signature && rawBody) {
      const isValid = validateWebhookSignature(
        rawBody,
        signature,
        subscribeData.secretKey
      )

      if (!isValid) {
        throw new z.errors.Error("Invalid webhook signature", "InvalidSignature", 401)
      }
    }
  }

  return [bundle.cleanedRequest]
}

/**
 * Get sample data using polling
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @param {Function} pollingFunction
 * @returns {Promise<WebhookEventData[]>}
 */
async function performList(z, bundle, pollingFunction) {
  return await pollingFunction(z, bundle)
}

/**
 * Create webhook trigger
 * @param {string} key
 * @param {string} label
 * @param {string} description
 * @param {number[]} eventIds
 * @param {Object} options
 * @param {Object[]=} options.inputFields
 * @param {Function=} options.pollingFallback
 * @param {Object=} options.sample
 * @param {string=} options.noun
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
       * @returns {WebhookEventData[]}
       */
      perform: (z, bundle) => {
        return performWebhook(z, bundle)
      },

      /**
       * @param {ZObject} z
       * @param {Bundle<SessionAuthenticationData>} bundle
       * @returns {Promise<WebhookEventData[]>}
       */
      performList: options.pollingFallback ? (z, bundle) => {
        if (!options.pollingFallback) {
          throw new Error("pollingFallback is required")
        }
        return performList(z, bundle, options.pollingFallback)
      } : undefined,

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
  generateSecretKey,
  performList,
  performWebhook,
  subscribeWebhook,
  unsubscribeWebhook,
  validateWebhookSignature
}
