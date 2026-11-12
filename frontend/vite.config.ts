import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Frontend calls /api/* on the same origin; Vite forwards them to the backend.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
