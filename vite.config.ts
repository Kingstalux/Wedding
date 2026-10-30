import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed ports so this project never collides with other local apps.
  // strictPort: fail loudly instead of silently picking another port.
  server: { port: 5180, strictPort: true },
  preview: { port: 5181, strictPort: true },
  build: {
    rolldownOptions: {
      output: {
        // The big libraries go in their own files. They rarely change, so a
        // guest's browser keeps them cached when we deploy an update to our code.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/,
            },
            { name: 'supabase', test: /node_modules[\\/](@supabase|iceberg-js|tslib)[\\/]/ },
            { name: 'query', test: /node_modules[\\/]@tanstack[\\/]/ },
          ],
        },
      },
    },
  },
})
