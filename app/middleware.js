//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

/**
 * @typedef {import("zapier-platform-core").HttpResponse} HttpResponse
 */

/**
     * @param {HttpResponse} response
     * @param {ZObject} z
     * @returns {HttpResponse}
     */
const errorHandling = (response, z) => {
  if (response.status === 429) {
    response.skipThrowForStatus = true
    throw new z.errors.ThrottledError("Too many requests, Zapier will retry in 60 seconds", 60)
  }

  if ((response.status >= 400 && response.status <= 500)) {
    response.skipThrowForStatus = true
    const message = response.data.error?.message || response.data.message || "Unknown error"
    const request = {
      url: response.request.url,
      method: response.request.method,
      body: response.request.body
    }
    const stack = response.data.error?.stack || ""
    z.console.log(`
    Message: ${message}\n
    Request:\n
    url: ${request.url}\n
    method: ${request.method}\n
    body: ${request.body}\n
    Stack: ${stack}
    `)
    // @ts-ignore TODO
    const code = response.request.input?._zapier?.event?.method || request.method + " " + request.url
    throw new z.errors.Error(message, code, response.data.statusCode)
  }
  return response
}

module.exports = {
  errorHandling
}
