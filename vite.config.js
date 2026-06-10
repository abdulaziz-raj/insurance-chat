import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// We proxy backend paths → the Spring Boot app so the browser never makes a
// cross-origin request (no CORS headers needed on the server during dev).
// Defaults to a locally-run backend; override with VITE_BACKEND to point at a
// LAN host (e.g. VITE_BACKEND=http://10.0.0.126:8080).
const BACKEND = process.env.VITE_BACKEND ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // The live insurance agent lives under /termlife_api; /api covers the
      // other demo controllers (chat, nigo, claims_intake, ai/search, …).
      '/termlife_api': { target: BACKEND, changeOrigin: true },
      '/api': { target: BACKEND, changeOrigin: true },
    },
  },
})
