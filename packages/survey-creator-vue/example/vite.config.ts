import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => { 
  return {
    plugins: [
      vue(),
    ],
    resolve: {
      dedupe: ["survey-creator-core", "survey-core", "survey-vue3-ui", "vue" ],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5000,
      strictPort: true,
      hmr: {
        clientPort: 443,
        protocol: 'wss'
      }
    }
  }
})
