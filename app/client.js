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

    return data.response
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

module.exports = { Client, Service }
