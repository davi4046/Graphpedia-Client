import { defineConfig } from "@solidjs/start/config"

export default defineConfig({
  vite: {
    envPrefix: ["PUBLIC_"],
  },
  server: {
    preset: "cloudflare-pages",

    rollupConfig: {
      external: ["node:async_hooks"],
    },
  },
})
