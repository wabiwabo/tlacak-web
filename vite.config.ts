import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    proxy: {
      '/api/socket': 'ws://localhost:8082',
      '/api': 'http://localhost:8082',
    },
  },
  build: { outDir: 'build' },
});
