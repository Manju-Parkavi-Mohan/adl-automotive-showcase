// Standalone Vite config for running the app OUTSIDE the Lovable sandbox
// (e.g. from a plain GitHub clone). It replicates what
// @lovable.dev/vite-tanstack-config sets up internally: TanStack Start,
// React, Tailwind v4, tsconfig path aliases, and the "@" alias.
//
// Use with:
//   npm run dev:standalone
//   npm run build:standalone
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "node:path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
  },
});