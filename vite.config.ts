import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths so the build works on any static host / sub-path
  server: {
    host: true, // reachable from Docker
    port: 5173,
    watch: { usePolling: true }, // reliable file watching inside Docker on Windows
  },
  build: {
    chunkSizeWarningLimit: 2000, // Phaser is big; that's expected
  },
});
