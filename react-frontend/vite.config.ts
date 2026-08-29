import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
      '/admin': 'http://localhost:8080',
      '/authenticate': 'http://localhost:8080',
      '/borrow': 'http://localhost:8080',
    },
  },
})
