/**
 * vite.config.ts — Vite build configuration for the Day Tracker frontend.
 *
 * Key settings:
 *   - React plugin for JSX/TSX support
 *   - __APP_VERSION__ define: injects the BUILD_NUMBER env var (set by GitHub
 *     Actions) as a compile-time constant. Falls back to "dev" locally.
 *   - Dev server proxy: forwards /api/* requests to the local Azure Functions
 *     host (port 7071) so the frontend can call the API without CORS issues.
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Replaced at build time — used by VersionBadge component
    __APP_VERSION__: JSON.stringify(process.env.BUILD_NUMBER || "dev"),
  },
  server: {
    proxy: {
      // Proxy API calls to the local Azure Functions host during development
      "/api": "http://localhost:7071",
    },
  },
});
