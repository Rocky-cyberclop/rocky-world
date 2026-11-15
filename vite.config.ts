import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  base: './', // relative paths so the build works on any static host / sub-path
  server: {
    host: true, // reachable from Docker (and from a phone on the same Wi-Fi)
    port: 5173,
    watch: { usePolling: true }, // reliable file watching inside Docker on Windows
  },
  build: {
    chunkSizeWarningLimit: 2000, // Phaser is big; that's expected
    rollupOptions: {
      // two pages: the game, and the plain "skip the game" version (no Phaser)
      input: { main: page('index.html'), about: page('about.html') },
    },
  },
});
