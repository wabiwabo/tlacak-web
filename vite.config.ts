import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: {
    port: 3000,
    proxy: {
      '/api/socket': 'ws://localhost:8082',
      '/api': 'http://localhost:8082',
    },
  },
  build: {
    outDir: 'build',
    // Pre-split the heavy third-party libraries so the main chunk doesn't
    // carry MapLibre / Recharts / ExcelJS for every cold page load.
    // Vite 8 / Rolldown requires manualChunks as a function.
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('maplibre-gl') ||
            id.includes('mapbox-gl-draw') ||
            id.includes('mapbox-gl-rtl-text') ||
            id.includes('maplibre-gl-geocoder') ||
            id.includes('maplibre-google-maps') ||
            id.includes('@turf/circle') ||
            id.includes('@tmcw/togeojson') ||
            id.includes('wellknown')
          ) {
            return 'vendor-maplibre';
          }
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts';
          if (id.includes('exceljs') || id.includes('file-saver')) return 'vendor-exceljs';
          if (
            id.includes('@mui/') ||
            id.includes('@emotion/') ||
            id.includes('mui-file-input') ||
            id.includes('tss-react') ||
            id.includes('stylis')
          ) {
            return 'vendor-mui';
          }
          if (
            id.includes('react-rnd') ||
            id.includes('react-qr') ||
            id.includes('@yudiel/react-qr-scanner')
          ) {
            return 'vendor-rnd-qr';
          }
          if (id.includes('hls.js')) return 'vendor-hls';
          if (
            id.includes('@tanstack/react-query') ||
            id.includes('@tanstack/react-table') ||
            id.includes('@tanstack/react-virtual')
          ) {
            return 'vendor-tanstack';
          }
          if (
            id.includes('radix-ui') ||
            id.includes('@radix-ui') ||
            id.includes('class-variance-authority') ||
            id.includes('lucide-react') ||
            id.includes('cmdk')
          ) {
            return 'vendor-ui';
          }
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'vendor-i18n';
          }
          if (id.includes('react-window')) return 'vendor-window';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
