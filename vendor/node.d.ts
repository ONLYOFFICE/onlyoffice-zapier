declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DOC_SPACE_BASE_URL: string
      DOC_SPACE_USERNAME: string
      DOC_SPACE_PASSWORD: string
      ZAPIER_DEPLOY_KEY: string
    }
  }
}

export {}
