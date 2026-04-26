import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

const allowedPreviewHosts = [
  'razowild.com',
  'www.razowild.com',
  'admin.razowild.com',
]

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  preview: {
    port: 3000,
    allowedHosts: allowedPreviewHosts,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})