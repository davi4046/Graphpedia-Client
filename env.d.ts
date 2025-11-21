interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string
  readonly PUBLIC_DATA_URL: string
  readonly PUBLIC_USER_AGENT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
