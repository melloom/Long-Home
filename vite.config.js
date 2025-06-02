import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    hmr: {
      port: 5174,
      overlay: true
    },
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },
  publicDir: 'public',
  resolve: {
    extensions: ['.js', '.jsx', '.json']
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.platform': JSON.stringify(process.platform),
    'process.version': JSON.stringify(process.version),
    'process.stdout': {
      isTTY: false
    },
    'process.stderr': {
      isTTY: false
    }
  }
})