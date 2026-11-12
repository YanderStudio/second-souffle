// Configuration Vite : redirige /api vers l'API PHP servie par Apache (WampServer)
import { defineConfig } from 'vite';

const cibleApi = {
  target: 'http://localhost',
  changeOrigin: true,
  // /api/scores.php -> /second-souffle/api/scores.php
  rewrite: (chemin) => chemin.replace(/^\/api/, '/second-souffle/api'),
};

export default defineConfig({
  server: { port: 5173, strictPort: true, proxy: { '/api': cibleApi } },
  preview: { port: 4173, strictPort: true, proxy: { '/api': cibleApi } },
});
