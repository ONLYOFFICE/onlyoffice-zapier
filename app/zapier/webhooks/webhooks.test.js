//
// (c) Copyright Ascensio System SIA 2026
//

// @ts-check

const { createAppTester } = require("zapier-platform-core")
const { equal, not } = require("uvu/assert")
const { suite } = require("uvu")
const { App } = require("../../app.js")
const { fileCreatedInMyDocuments } = require("../files/triggers.js")
const { sessionAuthContext, sessionAuthPerform } = require("../auth/auth.fixture.js")

const tester = createAppTester(App)

const Webhooks = suite("webhooks", {
  ...sessionAuthContext(),
  subscribeData: { id: "" }
})

Webhooks.before(async (context) => {
  await sessionAuthPerform(tester, context)
})

Webhooks("subscribes to a webhook with a generated secret key", async (context) => {
  const { performSubscribe } = fileCreatedInMyDocuments.operation
  // The target must answer HEAD requests. The workspace itself is used, so
  // that events aren't sent anywhere else.
  const bundle = {
    authData: context.authData,
    inputData: {},
    targetUrl: `${context.authData.baseUrl}/robots.txt?zapier-test=${Date.now()}`
  }
  const subscription = await tester(performSubscribe, bundle)
  context.subscribeData = { ...subscription, id: String(subscription.id) }
  not.equal(subscription.id, undefined)
  equal(subscription.secretKey.length, 30)
  equal(subscription.triggers, 128 + 256)
})

Webhooks("unsubscribes from the webhook", async (context) => {
  const { performUnsubscribe } = fileCreatedInMyDocuments.operation
  const bundle = {
    authData: context.authData,
    subscribeData: context.subscribeData
  }
  await tester(performUnsubscribe, bundle)
})

Webhooks("unsubscribes from a webhook that has already been removed", async (context) => {
  const { performUnsubscribe } = fileCreatedInMyDocuments.operation
  const bundle = {
    authData: context.authData,
    subscribeData: context.subscribeData
  }
  await tester(performUnsubscribe, bundle)
})

Webhooks.run()
