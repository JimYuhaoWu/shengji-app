import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The game server (shengji-server) runs on :8000. In dev we proxy the WebSocket
// and REST endpoints to it so the client can use same-origin relative URLs
// (ws://<host>/ws/...), which also matches a reverse-proxied production setup.
const BACKEND = 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ws': { target: BACKEND, ws: true, changeOrigin: true },
      '/rooms': { target: BACKEND, changeOrigin: true },
      '/health': { target: BACKEND, changeOrigin: true },
    },
  },
})
