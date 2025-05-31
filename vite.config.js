import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    hmr: {
      protocol: process.env.NODE_ENV === 'production' ? 'wss' : 'ws',
      host: process.env.NODE_ENV === 'production' ? window.location.hostname : 'localhost',
      port: process.env.NODE_ENV === 'production' ? 443 : 5173
    }
  },
  publicDir: 'public',
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  }
})