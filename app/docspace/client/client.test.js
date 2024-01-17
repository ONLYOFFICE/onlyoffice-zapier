//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { Assertion, equal, not, unreachable } = require("uvu/assert")
const { test } = require("uvu")
const { Client, Progress } = require("./client.js")
const samples = require("../../docspace/files/files.samples.js")

/**
 * @typedef {import("./client.js").Filters} Filters
 */

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
    filterBy: "userName",
    filterOp: "startsWith",
    filterValue: "John",
    sortBy: "DateAndTime",
    sortOrder: "descending",
    startIndex: 0
  }
  const url = client.url("/files", filters)

  equal(
    url,
    "https://example.com/api/2.0/files?count=1&filterBy=userName&filterOp=startsWith&filterValue=John&sortBy=DateAndTime&sortOrder=descending&startIndex=0"
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
    return [samples.progress]
  }

  const progress = new Progress(endpoint, samples.progress)
  const response = await progress.endpoint()
  equal(response.length, 1)
  equal(response[0].error, samples.progress.error)
  equal(response[0].progress, samples.progress.progress)
  equal(response[0].percents, samples.progress.percents)
})

test("progress initializes with the endpoint and it's operation", async () => {
  async function endpoint() {
    return [samples.progress]
  }

  const progress = new Progress(endpoint, samples.progress)
  equal(progress.operation, samples.progress)
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
    return [samples.progress]
  }

  const progress = new Progress(endpoint, samples.progress)
  await progress.complete()

  equal(i, 20)
})

test("progress completes with the custom limit", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return [samples.progress]
  }

  const progress = new Progress(endpoint, samples.progress)
  await progress.complete(100, 10)

  equal(i, 10)
})

test("progress throws an error if the limit is negative or zero", async () => {
  async function endpoint() {
    return [samples.progress]
  }

  const progress = new Progress(endpoint, samples.progress)

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
    return [
      {
        error: "hola",
        finished: false,
        id: "00000000-1111-2222-3333-444444444444",
        operation: 0,
        percents: 0,
        processed: "0",
        progress: 0
      }
    ]
  }

  const progress = new Progress(endpoint, samples.progress)
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
    return [
      {
        error: "",
        finished: false,
        id: "00000000-1111-2222-3333-444444444444",
        operation: 0,
        percents: 0,
        processed: "0",
        progress: p
      }
    ]
  }

  const progress = new Progress(endpoint, samples.progress)
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
    return [
      {
        error: "",
        finished: false,
        id: "00000000-1111-2222-3333-444444444444",
        operation: 0,
        percents: p,
        processed: "0",
        progress: 0
      }
    ]
  }

  const progress = new Progress(endpoint, samples.progress)
  const response = await progress.complete()

  equal(i, 2)
  equal(p, 100)
  equal(response.error, "")
  equal(response.percents, 100)
})

test.run()
