import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // 1. NUNCA generar source maps en producción — revelan código original
    sourcemap: false,

    // Suprimir warning de chunks grandes (jspdf es 1.1MB por diseño)
    chunkSizeWarningLimit: 1500,

    // 2. Minificación agresiva con esbuild (incluido en Vite)
    minify: 'esbuild',

    // 3. Target moderno — bundle más pequeño y ofuscado
    target: 'es2020',

    rollupOptions: {
      output: {
        // 4. Nombres de chunks sin información semántica
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',

        // 5. Code splitting — fragmenta el código en múltiples chunks
        // Hace más difícil reconstruir la lógica completa
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          pdf: ['jspdf'],
        },
      },
    },

    // 6. Eliminar console.log en producción
    ...(mode === 'production' && {
      esbuildOptions: {
        drop: ['console', 'debugger'],
        pure: ['console.log', 'console.warn', 'console.info', 'console.debug'],
      },
    }),
  },

  // 7. Definir variables solo disponibles en build (no exponer nada extra)
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },

  // 8. Esbuild: eliminar console en producción
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}))
