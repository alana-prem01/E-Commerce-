import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// NOTE: The proxy below is only used during local development (`npm run dev`).
// In production the VITE_API_URL env var points directly to the Render backend.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      // Local dev proxy: rewrites /api/* → http://127.0.0.1:5000/api/*
      // Remove or ignore this when deploying; VITE_API_URL handles production.
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})
