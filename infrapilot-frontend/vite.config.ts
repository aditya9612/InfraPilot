import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://infrapilot.in',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://infrapilot.in',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    include: ['recharts', 'react-is'],
  },
})
