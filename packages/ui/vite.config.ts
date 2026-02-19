import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['@oktaman/shared'],
    force: command === 'serve',
  },
  build: {
    commonjsOptions: {
      include: [/shared/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  server: {
    watch: {
      ignored: ['!**/node_modules/@oktaman/**'],
    },
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3333',
        secure: false,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
'/socket.io': {
        target: 'http://127.0.0.1:3333',
        secure: false,
        changeOrigin: true,
        ws: true,
      },
    },
    port: 4200,
    host: true,
  },
  preview: {
    port: 4200,
  },
}))
