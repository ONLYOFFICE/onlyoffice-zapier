//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { Client, Progress } = require("./client.js")

test("has the actual version", () => {
  // @ts-ignore: it's okay.
  const client = new Client("", () => {})
  equal(client.version, "/api/2.0")
})

test("instance creation and initialization", () => {
  // @ts-ignore
  const progress = new Progress(() => 1)

  equal(progress.id, "")
  equal(progress.operation, 0)
  equal(progress.progress, 0)
  equal(progress.error, "")
  equal(progress.processed, "")
  equal(progress.finished, false)
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

test("finish method - check default iterations count", async () => {
  function wrapper() {
    let i = 0
    function request() {
      i += 1
      const finished = i === 20
      return { finished }
    }
    function calls() {
      return i
    }
    return { request, calls }
  }

  const { request, calls } = wrapper()
  // @ts-ignore
  const progress = new Progress(request)
  const finish = await progress.finish()

  equal(calls(), 20)
  equal(finish.finished, true)
})

test("finish method - delay check", async () => {
  async function request() {
    // @ts-ignore
    return new Progress(function() {
      return 1;
    });
  }

  const p1 = new Progress(request)
  p1.id = "80"
  const delay80 = p1.finish(80, 10)

  const p2 = new Progress(request)
  p2.id = "100"
  const delay100 = p2.finish(100, 10)

  const p3 = new Progress(request)
  p3.id = "120"
  const delay120 = p3.finish(120, 10)

  const result1 = await Promise.race([delay80, delay100])
  const result2 = await Promise.race([delay100, delay120])

  equal(result1.id, "80")
  equal(result2.id, "100")
})

test("finish method - check 10 iterations", async () => {
  function wrapper() {
    let i = 0
    function request() {
      i += 1
      const finished = i === 10
      return { finished }
    }
    function calls() {
      return i
    }
    return { request, calls }
  }

  const { request, calls } = wrapper()
  // @ts-ignore
  const progress = new Progress(request)
  const finish = await progress.finish(100, 10)

  equal(calls(), 10)
  equal(finish.finished, true)
})

test("finish method - check false finished", async () => {
  function wrapper() {
    let i = 0
    function request() {
      i += 1
      const finished = i === 21
      return { finished }
    }
    return { request }
  }

  const { request } = wrapper()
  // @ts-ignore
  const progress = new Progress(request)
  const finish = await progress.finish()

  equal(finish.finished, false)
})

test.run()
