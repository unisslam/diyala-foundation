import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui:     ['framer-motion', 'lucide-react'],
          data:   ['@supabase/supabase-js', '@tanstack/react-query'],
          i18n:   ['react-i18next', 'i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
})
