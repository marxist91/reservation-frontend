import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import checker from 'vite-plugin-checker'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ['./tsconfig.json'],
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
  ],
  server: {
    // Rediriger toutes les routes vers index.html pour le SPA
    historyApiFallback: true,
    port: 5173,
    strictPort: false,
  },
  // Configuration optimisée pour le build en production
  build: {
    target: 'es2020',
    minify: false, // Désactivé temporairement pour debug
    rollupOptions: {
      output: {
        // Désactivé temporairement
        // manualChunks: {
        //   'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        //   'vendor-mui': ['@mui/material', '@mui/icons-material'],
        //   'vendor-query': ['@tanstack/react-query'],
        //   'vendor-charts': ['recharts'],
        // },
      },
    },
    sourcemap: false, // Désactivé pour accélérer
  },
})
