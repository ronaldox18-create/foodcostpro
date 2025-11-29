/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração do Vite
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
    },
    define: {
      // Injeta a variável de ambiente corretamente
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Evita crash por acesso indevido ao process.env no navegador
      'process.env': {}
    },
    build: {
      chunkSizeWarningLimit: 1000, // Aumenta limite para 1MB
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            supabase: ['@supabase/supabase-js'],
            ui: ['lucide-react']
          }
        }
      }
    }
  };
});