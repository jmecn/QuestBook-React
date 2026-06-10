import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localeJson404Plugin } from './vite-locale-json-404'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const localesDir = path.join(rootDir, 'public/locales')

export default defineConfig({
  base: './',
  plugins: [localeJson404Plugin(localesDir), react()],
  build: {
    copyPublicDir: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@xyflow')) return 'xyflow'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/i18next') || id.includes('node_modules/react-i18next')) {
            return 'i18n'
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.join(rootDir, 'src'),
    },
  },
})
