import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const backendTarget = loadEnv(mode, '.', 'VITE_')['VITE_API_URL'] ?? 'http://localhost:3000';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: backendTarget, changeOrigin: true } },
    },
    build: { target: 'es2020', sourcemap: false },
  };
});
