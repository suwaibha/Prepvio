import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const mainBackendUrl = env.VITE_MAIN_BACKEND_URL || 'http://localhost:5000'
  const contentBackendUrl = env.VITE_CONTENT_BACKEND_URL || 'http://localhost:8000'

  return {
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      // 🟢 AdminBackend Routes (Port 8000)
      '/api/services': { target: contentBackendUrl, changeOrigin: true },
      '/api/courses': { target: contentBackendUrl, changeOrigin: true },
      '/api/aptitude': { target: contentBackendUrl, changeOrigin: true },
      '/api/categories': { target: contentBackendUrl, changeOrigin: true },
      '/api/dashboard': { target: contentBackendUrl, changeOrigin: true },
      '/api/channels': { target: contentBackendUrl, changeOrigin: true },
      '/api/playlists': { target: contentBackendUrl, changeOrigin: true },
      '/api/quizzes': { target: contentBackendUrl, changeOrigin: true },
      '/api/videos': { target: contentBackendUrl, changeOrigin: true },

      // 🔵 Main Backend Routes (Port 5000)
      '/api': {
        target: mainBackendUrl,
        changeOrigin: true,
        secure: false,
      },
      '/run': {
        target: mainBackendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  }
})
