//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { equal } = require("uvu/assert")
const { test } = require("uvu")
const { isZapierUrl } = require("./uploader.js")

test("recognizes zapier urls by the host", () => {
  equal(isZapierUrl("https://zapier.com/engine/hydrate/1/abc/"), true)
  equal(isZapierUrl("https://hooks.zapier.com/file"), true)
})

test("does not trust other hosts that start with zapier", () => {
  equal(isZapierUrl("https://zapier.example.com/file"), false)
  equal(isZapierUrl("https://zapier-files.example.com/file"), false)
  equal(isZapierUrl("https://example.com/zapier.com"), false)
  equal(isZapierUrl("http://zapier.com/file"), false)
  equal(isZapierUrl("not a url"), false)
})

test.run()
