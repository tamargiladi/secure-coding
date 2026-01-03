import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative asset paths so the build works when deployed under a sub-path or opened from a file:// bundle
  base: './',
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Prevent code injection through chunk names
        sanitizeFileName: (name) => {
          return name.replace(/[^a-zA-Z0-9_-]/g, '_');
        }
      }
    }
  }
})
