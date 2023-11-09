//
// (c) Copyright Ascensio System SIA 2023
//

// @ts-check

const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { Client } = require("./client.js")

test("has the actual version", () => {
  // @ts-ignore: it's okay.
  const client = new Client("", () => {})
  equal(client.version, "/api/2.0")
})

test.run()
