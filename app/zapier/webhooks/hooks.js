//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const crypto = require("crypto")
const { Client } = require("../../docspace/client/client.js")
const { WebhooksService } = require("../../docspace/webhooks/webhooks.js")
const { WEBHOOK_TRIGGER_NAMES } = require("../../docspace/webhooks/events.js")

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

  const triggers = eventIds.reduce((mask, id) => mask | id, 0)

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
    await webhooks.deleteWebhook(Number(bundle.subscribeData.id))
  }
}

/**
 * Handle webhook request
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @param {Object} [filters]
 * @param {number} [filters.rootFolderType]
 * @param {number[]} [eventIds]
 * @returns {WebhookEventData[]}
 */
function performWebhook(z, bundle, filters = {}, eventIds = []) {
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

  const webhookBody = bundle.cleanedRequest
  const event = webhookBody.payload || webhookBody
  const inputData = bundle.inputData || {}

  // Filter by event trigger name
  if (eventIds.length > 0 && webhookBody.event && webhookBody.event.trigger) {
    const expectedTriggers = eventIds
      .map((id) => WEBHOOK_TRIGGER_NAMES[id])
      .filter(Boolean)
    if (
      expectedTriggers.length > 0 &&
      !expectedTriggers.includes(webhookBody.event.trigger)
    ) {
      return []
    }
  }

  // Filter by rootFolderType
  if (filters.rootFolderType !== undefined) {
    if (
      event.rootFolderType === undefined ||
      Number(event.rootFolderType) !== Number(filters.rootFolderType)
    ) {
      return []
    }
  }

  // Filter by room id if specified
  if (inputData.id !== undefined) {
    let eventRoomId

    if (event.roomType !== undefined) {
      eventRoomId = event.id
    } else if (event.rootFolderId !== undefined) {
      eventRoomId = event.rootFolderId
    } else if (event.roomId !== undefined) {
      eventRoomId = event.roomId
    }

    if (
      eventRoomId !== undefined &&
      Number(eventRoomId) !== Number(inputData.id)
    ) {
      return []
    }
  }

  // Filter by folder id
  const effectiveFolderId =
    inputData.folderId !== undefined ? inputData.folderId : inputData.id

  if (effectiveFolderId !== undefined) {
    let eventFolderId

    if (event.originId !== undefined) {
      eventFolderId = event.originId
    } else if (event.folderId !== undefined) {
      eventFolderId = event.folderId
    } else if (event.parentId !== undefined) {
      eventFolderId = event.parentId
    }

    if (inputData.folderId !== undefined) {
      // Explicit folderId: require match
      if (
        eventFolderId === undefined ||
        Number(eventFolderId) !== Number(effectiveFolderId)
      ) {
        return []
      }
    } else if (eventFolderId !== undefined) {
      // Room ID fallback: skip events without folder data
      if (Number(eventFolderId) !== Number(effectiveFolderId)) {
        return []
      }
    }
  }

  // Filter by active status if specified (for user events)
  if (inputData.active !== undefined) {
    if (event.activationStatus === undefined) {
      return []
    }
    const isActive = event.activationStatus === 2
    const expectedActive = String(inputData.active) === "true"
    if (isActive !== expectedActive) {
      return []
    }
  }

  // Coerce id to number for Zapier dedup
  if (event.id !== undefined) {
    event.id = Number(event.id)
  }

  return [event]
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
 * @param {{rootFolderType?: number}=} options.filters
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
        return performWebhook(z, bundle, options.filters, eventIds)
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
