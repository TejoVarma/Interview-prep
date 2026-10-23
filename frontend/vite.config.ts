import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Locally the backend runs on 8010 (8000 is taken on this machine).
// In production Amplify does the same /api rewrite to Beanstalk.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
