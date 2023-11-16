import * as z from "zapier-platform-core"

declare global {
  type HttpMethod = z.HttpMethod
  type HttpRequestOptions = z.HttpRequestOptions
  type ZObject = z.ZObject
  type Bundle<AuthData = { [x: string]: any }, InputData = { [x: string]: any }> = z.Bundle<InputData> & { authData: AuthData }
  type ZRequest = z.ZObject["request"]

  type ApplicationConfig = {
    triggers: {
      [key: TriggerConfig["key"]]: TriggerConfig
    }
  }

  /**
   * [Zapier Reference](https://github.com/zapier/zapier-platform/blob/zapier-platform-schema%4015.5.0/packages/cli/README.md#triggerssearchescreates)
   */
  type TriggerConfig = {
    key: string
    noun: string
    display: {
      label: string
      description: string
    }
    operation: {
      perform: TriggerPerform<any>
    }
  }

  type TriggerPerform<T> = (z: ZObject, bundle: Bundle) => T

  type createAppTester = typeof z.createAppTester
}
