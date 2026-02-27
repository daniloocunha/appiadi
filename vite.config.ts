import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'IADI - Gestão de Membros',
        short_name: 'IADI',
        description: 'Sistema de Gestão de Membros - Igreja Assembleia de Deus em Iaçu',
        theme_color: '#1e3a8a',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        lang: 'pt-BR',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // @react-pdf/renderer gera chunks > 2MB — aumentamos o limite
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxAgeSeconds: 86400, maxEntries: 200 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: { maxAgeSeconds: 604800, maxEntries: 500 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    // Code-splitting: isola bibliotecas pesadas em chunks separados
    rollupOptions: {
      output: {
        manualChunks: {
          // Roteamento
          'router': ['react-router-dom'],
          // PDF (maior chunk — ~1.5 MB)
          'pdf': ['@react-pdf/renderer'],
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          // IndexedDB
          'dexie': ['dexie'],
          // Formulários e validação
          'forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
          // UI utilitários
          'utils': ['date-fns', 'uuid', 'qrcode', 'lucide-react'],
        },
      },
    },
    // Aumenta o threshold para o aviso de chunk grande (PDF é inevitavelmente grande)
    chunkSizeWarningLimit: 1600,
  },
})
