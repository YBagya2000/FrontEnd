import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port:80,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Remove the rewrite since we want to keep /api in the path
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})