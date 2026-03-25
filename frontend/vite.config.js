import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const LOCAL_BACKEND = 'http://172.16.20.57:8080'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api':    { target: LOCAL_BACKEND, changeOrigin: true },
      '/static': { target: LOCAL_BACKEND, changeOrigin: true },
    },
  },
})
