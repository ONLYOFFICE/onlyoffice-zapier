//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { isSameOrigin } = require("../docspace/auth/auth.js")

/**
 * @typedef {import("../docspace/auth/auth.js").SessionAuthenticationData} SessionAuthenticationData
 * @typedef {import("zapier-platform-core").HttpResponse} HttpResponse
 */

/**
 * @param {HttpResponse} response
 * @returns {string}
 */
function workspaceMessage(response) {
  try {
    // Raw responses, for example, of downloads, have no parsed data.
    const { data } = response
    const message = data && data.error && data.error.message
    return typeof message === "string" ? message : ""
  } catch {
    return ""
  }
}

/**
 * Without this, Zapier shows the raw response of the workspace, for example,
 * when the user has no rights.
 * @param {HttpResponse} response
 * @param {ZObject} z
 * @param {Bundle<SessionAuthenticationData>} bundle
 * @returns {HttpResponse}
 */
function explainRefusal(response, z, bundle) {
  const { status } = response
  if (response.skipThrowForStatus || (status !== 402 && status !== 403)) {
    return response
  }
  if (!isSameOrigin(response.request.url || "", bundle.authData && bundle.authData.baseUrl)) {
    return response
  }
  const message = workspaceMessage(response)
  const details = message ? ` (${message})` : ""
  if (status === 403) {
    throw new z.errors.Error(
      `The workspace refused the request${details}. ` +
        "Check that your account has the rights for it: its user type and its role in the room.",
      "Forbidden",
      403
    )
  }
  throw new z.errors.Error(
    `The tariff of the workspace doesn't allow the request${details}.`,
    "PaymentRequired",
    402
  )
}

module.exports = {
  afterResponse: [explainRefusal]
}
