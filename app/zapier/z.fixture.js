//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

/**
 * @typedef {Object} RecordedRequest
 * @property {string} method
 * @property {string} path
 * @property {Record<string, string>} query
 * @property {any} body
 */

/**
 * @typedef {(request: RecordedRequest) => any} RouteHandler
 */

/**
 * @typedef {Object} FakeZ
 * @property {RecordedRequest[]} calls
 * @property {any} errors
 * @property {(options: {method?: string, url: string, body?: any}) => Promise<{data: any}>} request
 * @property {(func: Function, inputData: Object) => string} dehydrateFile
 */

class HaltedError extends Error {}

class RefreshAuthError extends Error {}

class ZapierError extends Error {}

const authData = {
  baseUrl: "https://example.onlyoffice.com",
  sessionKey: "key"
}

/**
 * Creates a simple `z` object that answers requests with the routes instead of
 * a workspace. A route key is `METHOD /path`, where the path is relative to
 * `/api/2.0`. A request without a route fails with the 404 status.
 * @param {Record<string, RouteHandler | object | boolean>} routes
 * @returns {FakeZ}
 */
function fakeZ(routes) {
  /** @type {RecordedRequest[]} */
  const calls = []
  return {
    calls,
    dehydrateFile(func, inputData) {
      return `hydrate|||${JSON.stringify({ inputData, method: func.name })}|||hydrate`
    },
    errors: {
      Error: ZapierError,
      HaltedError,
      RefreshAuthError
    },
    async request(options) {
      const url = new URL(options.url)
      const method = options.method || "GET"
      const path = url.pathname.replace(/^\/api\/2\.0/, "")
      /** @type {RecordedRequest} */
      const call = {
        body: options.body,
        method,
        path,
        query: Object.fromEntries(url.searchParams)
      }
      calls.push(call)
      const key = `${method} ${path}`
      if (!Object.hasOwn(routes, key)) {
        throw new Error(JSON.stringify({ status: 404 }))
      }
      const route = routes[key]
      const response = typeof route === "function" ? route(call) : route
      return { data: { response, status: 0 } }
    }
  }
}

module.exports = {
  HaltedError,
  RefreshAuthError,
  authData,
  fakeZ
}
