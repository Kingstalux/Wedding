import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed ports so this project never collides with other local apps.
  // strictPort: fail loudly instead of silently picking another port.
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
})
