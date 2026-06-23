//
// (c) Copyright Ascensio System SIA 2025
//

// @ts-check

const { Service } = require("../client/client.js")

/**
 * @typedef {Object} WebhookSubscriptionData
 * @property {number} id
 * @property {string} uri
 * @property {string} secretKey
 * @property {boolean} enabled
 * @property {number} triggers
 * @property {string} name
 */

/**
 * @typedef {Object} CreateWebhookBody
 * @property {string} name
 * @property {string} uri
 * @property {string} secretKey
 * @property {number} triggers
 * @property {boolean=} enabled
 * @property {boolean=} ssl
 */

class WebhooksService extends Service {
  /**
   * Create a new webhook subscription
   * ```http
   * POST /settings/webhook
   * ```
   * @param {CreateWebhookBody} body
   * @returns {Promise<WebhookSubscriptionData>}
   */
  createWebhook(body) {
    const url = this.client.url("/settings/webhook")
    return this.client.request("POST", url, body)
  }

  /**
   * Delete a webhook subscription
   * ```http
   * DELETE /settings/webhook/:id
   * ```
   * @param {number} id
   * @returns {Promise<void>}
   */
  deleteWebhook(id) {
    const url = this.client.url(`/settings/webhook/${id}`)
    return this.client.request("DELETE", url)
  }
}

module.exports = {
  WebhooksService
}
