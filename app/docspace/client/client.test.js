//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { Assertion, equal, not, unreachable } = require("uvu/assert")
const { test } = require("uvu")
const { Client, isNotFoundError, normalizeId, Progress, stripExtension } = require("./client.js")

/** @type {import("../files/files.js").ProgressData} */
const operation = {
  Operation: 0,
  error: "",
  finished: false,
  id: "00000000-1111-2222-3333-444444444444",
  processed: "0",
  progress: 0
}

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
    filterValue: "John",
    sortBy: "DateAndTime",
    sortOrder: "descending",
    startIndex: 0
  }
  const url = client.url("/files", filters)

  equal(
    url,
    "https://example.com/api/2.0/files?count=1&filterValue=John&sortBy=DateAndTime&sortOrder=descending&startIndex=0"
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
    return [operation]
  }

  const progress = new Progress(endpoint, operation)
  const response = await progress.endpoint()
  equal(response.length, 1)
  equal(response[0].error, operation.error)
  equal(response[0].progress, operation.progress)
})

test("progress initializes with the endpoint and it's operation", async () => {
  async function endpoint() {
    return [operation]
  }

  const progress = new Progress(endpoint, operation)
  equal(progress.operation, operation)
})

/**
 * Uses a fake clock, so that the tests don't wait.
 * @param {Progress} progress
 * @returns {number[]} The pauses between the checks.
 */
function fakeClock(progress) {
  /** @type {number[]} */
  const pauses = []
  let time = 0
  progress.now = () => time
  progress.wait = async (delay) => {
    pauses.push(delay)
    time = time + delay
  }
  return pauses
}

test("progress checks the operation every half a second", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return [{ ...operation, finished: i === 3, progress: i === 3 ? 100 : 50 }]
  }

  const progress = new Progress(endpoint, operation)
  const pauses = fakeClock(progress)
  const response = await progress.complete()

  equal(i, 3)
  equal(pauses, [
    500,
    500
  ])
  equal(response.finished, true)
})

test("progress gives up after 20 seconds", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return [operation]
  }

  const progress = new Progress(endpoint, operation)
  fakeClock(progress)
  const response = await progress.complete()

  // It checks at 0, 0.5, ..., 20 seconds.
  equal(i, 41)
  equal(response.finished, false)
})

test("progress waits with the custom delay and timeout", async () => {
  let i = 0
  async function endpoint() {
    i += 1
    return [operation]
  }

  const progress = new Progress(endpoint, operation)
  const pauses = fakeClock(progress)
  await progress.complete(100, 300)

  equal(i, 4)
  equal(pauses.every((pause) => pause === 100), true)
})

test("progress throws an error if the timeout is negative or zero", async () => {
  async function endpoint() {
    return [operation]
  }

  const progress = new Progress(endpoint, operation)

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
        Operation: 0,
        error: "hola",
        finished: false,
        id: "00000000-1111-2222-3333-444444444444",
        processed: "0",
        progress: 0
      }
    ]
  }

  const progress = new Progress(endpoint, operation)
  const response = await progress.complete()

  equal(i, 1)
  equal(response.error, "hola")
})

test("progress completes when the response contains 100 progress", async () => {
  let i = 0
  let p = 0
  let finished = false
  async function endpoint() {
    i += 1
    p += 50
    if (p === 100) {
      finished = true
    }
    return [
      {
        Operation: 0,
        error: "",
        finished: finished,
        id: "00000000-1111-2222-3333-444444444444",
        processed: "0",
        progress: p
      }
    ]
  }

  const progress = new Progress(endpoint, operation)
  fakeClock(progress)
  const response = await progress.complete()

  equal(i, 2)
  equal(p, 100)
  equal(finished, true)
  equal(response.error, "")
  equal(response.progress, 100)
})

test("detects not found errors of z.request", () => {
  equal(isNotFoundError(new Error(JSON.stringify({ status: 404 }))), true)
  equal(isNotFoundError(new Error(JSON.stringify({ status: 500 }))), false)
  equal(isNotFoundError(new Error("not json")), false)
  equal(isNotFoundError("404"), false)
})

test("normalizes numeric ids only", () => {
  equal(normalizeId("15"), 15)
  equal(normalizeId(15), 15)
  equal(normalizeId("sbox-1-abc"), "sbox-1-abc")
  equal(normalizeId("11111111-2222-3333-4444-555555555555"), "11111111-2222-3333-4444-555555555555")
})

test("strips the extension from a file title", () => {
  equal(stripExtension("Report.docx"), "Report")
  equal(stripExtension("archive.tar.gz"), "archive.tar")
  equal(stripExtension("README"), "README")
  equal(stripExtension(".env"), ".env")
})

test.run()
