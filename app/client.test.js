//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Assertion, equal, not, unreachable } = require("uvu/assert")
const { test } = require("uvu")
const { Client, Progress } = require("./client.js")

test("has the actual version", () => {
  // @ts-ignore: it's okay.
  const client = new Client("", () => {})
  equal(client.version, "/api/2.0")
})

test("url generate a valid URL with filters", () => {
  // @ts-ignore
  const client = new Client("https://example.com/", () => {})

  /** @type {Filters} */
  const filters = {
    count: 1,
    sortBy: "DateAndTime",
    sortOrder: "descending",
    startIndex: 0,
    filterBy: "userName",
    filterOp: "startsWith",
    filterValue: "John"
  }
  const url = client.url("/files", filters)

  equal(
    url,
    "https://example.com/api/2.0/files?count=1&sortBy=DateAndTime&sortOrder=descending&startIndex=0&filterBy=userName&filterOp=startsWith&filterValue=John"
  )
})

test("url generate a valid URL without filters", () => {
  // @ts-ignore
  const client = new Client("https://example.com/", () => {})
  const url = client.url("/files")

  equal(url, "https://example.com/api/2.0/files")
})

test("progress initializes with the endpoint", async () => {
  async function endpoint() {
    return {
      error: "",
      progress: 0,
      percents: 0
    }
  }

  const progress = new Progress(endpoint)
  equal(progress.options.length, 0)

  const response = await progress.endpoint()
  equal(response.error, "")
  equal(response.progress, 0)
  equal(response.percents, 0)
})

test("progress initializes with the endpoint and it's options", async () => {
  /**
   * @param {string} a
   * @param {number} b
   */
  async function endpoint(a, b) {
    return {
      error: "",
      a,
      b
    }
  }

  const progress = new Progress(endpoint, "", 0)
  equal(progress.options[0], "")
  equal(progress.options[1], 0)

  const response = await progress.endpoint(...progress.options)
  equal(response.a, "")
  equal(response.b, 0)
})

test("progress returns the response in the iterator's value", async () => {
  async function endpoint() {
    return {
      error: ""
    }
  }

  const progress = new Progress(endpoint)
  const result = await progress[Symbol.asyncIterator]().next()

  equal(result.done, false)
  equal(result.value.error, "")
})

test("progress iterates the endpoint", async () => {
  async function endpoint() {
    return {
      error: ""
    }
  }

  const progress = new Progress(endpoint)
  for await (const response of progress) {
    equal(response.error, "")
    return
  }

  unreachable()
})

test("progress completes with a default delay", async () => {
  // todo: find a way to test this case.
})

test("progress completes with the custom delay", async () => {
  // todo: find a way to test this case.
})

test("progress completes with a default limit", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return {
      error: "",
      percents: 0
    }
  }

  const progress = new Progress(endpoint)
  await progress.complete()

  equal(i, 20)
})

test("progress completes with the custom limit", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return {
      error: "",
      percents: 0
    }
  }

  const progress = new Progress(endpoint)
  await progress.complete(100, 10)

  equal(i, 10)
})

test("progress throws an error if the limit is negative or zero", async () => {
  async function endpoint() {
    return {
      error: "",
      percents: 0
    }
  }

  const progress = new Progress(endpoint)

  try {
    await progress.complete(100, 0)
    unreachable()
  } catch (error) {
    not.instance(error, Assertion)
  }

  try {
    await progress.complete(100, -1)
    unreachable()
  } catch (error) {
    not.instance(error, Assertion)
  }
})

test("progress breaks if the response contains an error", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return {
      error: "hola"
    }
  }

  const progress = new Progress(endpoint)
  const response = await progress.complete()

  equal(i, 1)
  equal(response.error, "hola")
})

test("progress completes when the response contains 100 progress", async () => {
  let i = 0
  let p = 0
  async function endpoint() {
    i += 1
    p += 50
    return {
      error: "",
      progress: p
    }
  }

  const progress = new Progress(endpoint)
  const response = await progress.complete()

  equal(i, 2)
  equal(p, 100)
  equal(response.error, "")
  equal(response.progress, 100)
})

test("progress completes when the response contains 100 percents", async () => {
  let i = 0
  let p = 0
  async function endpoint() {
    i += 1
    p += 50
    return {
      error: "",
      percents: p
    }
  }

  const progress = new Progress(endpoint)
  const response = await progress.complete()

  equal(i, 2)
  equal(p, 100)
  equal(response.error, "")
  equal(response.percents, 100)
})

test.run()
