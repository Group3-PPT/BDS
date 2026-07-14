import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://bds-group3-ppt.onrender.com',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: 'https://bds-group3-ppt.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
