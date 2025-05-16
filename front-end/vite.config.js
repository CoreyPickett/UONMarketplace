import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://sdprnlqq-8000.aue.devtunnels.ms/',
        changeOrigin: true,
      }
    }
  }
})
