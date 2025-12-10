import { defineConfig } from "@solidjs/start/config"

export default defineConfig({
  vite: {
    envPrefix: ["PUBLIC_"],
    server: {
      allowedHosts: true,
    },
  },
  server: {
    preset: "cloudflare-pages",
  },
})
