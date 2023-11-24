//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

class Client {
  /**
   * @param {string} baseUrl
   * @param {ZRequest} zrequest
   */
  constructor(baseUrl, zrequest) {
    this.version = "/api/2.0"
    this.baseUrl = baseUrl
    this.zrequest = zrequest
  }

  /**
   * @param {HttpMethod} method
   * @param {string} path
   * @param {HttpRequestOptions["body"]} body
   * @returns {Promise<any>}
   */
  async request(method, path, body = {}) {
    // Here, we don't use the URL constructor to join URL parts because we
    // assume that the base URL is already normalized and it's safe to simply
    // append a string to it. Additionally, we require that the path starts with
    // a backslash, so this should be safe as well.
    const url = `${this.baseUrl}${this.version}${path}`
    const response = await this.zrequest({ url, method, body })

    const { data } = response
    if (!data) {
      throw Error("TODO")
    }

    const { status } = data
    if (status !== 0) {
      throw Error("TODO")
    }

    if (data.response.hasOwnProperty('finished')) {
      const request = this.request.bind(this, method, path, body) 
      const progress = new Progress(request)
      progress.id = data.response.id
      progress.operation = data.response.operation
      progress.progress = data.response.progress
      progress.error = data.response.error
      progress.processed = data.response.processed
      progress.finished = data.response.finished
      return progress
    }

    return data.response
  }
}

class Progress {
  /**
   * @param {() => Promise<Progress>} request
   */
  constructor(request) {
    this.request = request
    this.id = ""
    this.operation = 0
    this.progress = 0
    this.error = ""
    this.processed = ""
    this.finished = false
  }

  /**
   * @param {number} delay
   * @param {number} limit
   * @returns {Promise<Progress>}
   */
  async finish(delay = 100, limit = 20) {
    if (this.finished || limit <= 0) {
      return this
    }

    const result = await this.next()
    if (result.finished) {
      return result
    }

    await new Promise(resolve => setTimeout(resolve, delay))
    return this.finish(delay, limit - 1)
  }

  /**
   * @returns {Promise<Progress>}
   */
  next() {
    return this.request()
  }
}

class Service {
  /**
   * @param {Client} client
   */
  constructor(client) {
    this.client = client
  }
}

module.exports = { Client, Service, Progress }
