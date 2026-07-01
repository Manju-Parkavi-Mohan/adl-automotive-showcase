// Default config for the Lovable-hosted build (Cloudflare Worker SSR).
// For running the app outside the Lovable sandbox, use vite.config.standalone.ts
// via `npm run dev:standalone` / `npm run build:standalone`.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
