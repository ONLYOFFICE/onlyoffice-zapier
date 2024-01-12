//
// (c) Copyright Ascensio System SIA 2023
//

const FormData = require("form-data")

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
  // Too many requests
  if (response.status === 429) {
    response.skipThrowForStatus = true
    throw new z.errors.ThrottledError("Too many requests, Zapier will retry in 60 seconds", 60)
  }

  // Error when uploading a file
  if (response.request.body instanceof FormData &&
    response.data && Object.hasOwn(response.data, "success") &&
    response.data.success === false) {
    response.skipThrowForStatus = true
    // @ts-ignore TODO: Property 'input' does not exist
    const inputData = response.request?.input?.bundle?.inputData
    const url = response.request?.url
    const message = response.data.message
    // @ts-ignore TODO: Property '_valueLength' does not exist
    const valueLength = response.request?.body?._valueLength
    const method = response.request?.method

    z.console.log(`
    Error when uploading a file
      Message: ${message}\n
      Url: ${url}\n
      InputData: ${JSON.stringify(inputData)}\n
      ValueLength: ${valueLength}\n
    `)

    // @ts-ignore TODO:
    const code = response.request.input?._zapier?.event?.method || method + " " + url
    throw new z.errors.Error(message, code, 400)
  }

  // Other errors
  if ((response.status >= 400 && response.status <= 500)) {
    response.skipThrowForStatus = true
    // @ts-ignore TODO: Property 'input' does not exist
    const inputData = response.request?.input?.bundle?.inputData
    const url = response.request?.url
    const message = response.data.error?.message || response.data.message || "Unknown error"
    const method = response.request?.method
    const stack = response.data.error?.stack || ""

    z.console.log(`
    Other errors
      Message: ${message}\n 
      Url: ${url}\n
      Method: ${method}\n
      InputData: ${JSON.stringify(inputData)}\n
      Stack: ${stack}
    `)

    // @ts-ignore TODO: Property 'input' does not exist
    const code = response.request.input?._zapier?.event?.method || method + " " + url
    throw new z.errors.Error(message, code, response.data.statusCode)
  }
  return response
}

module.exports = {
  errorHandling
}
