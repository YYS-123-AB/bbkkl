import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  clearScreen: false,
  server: {
    host: true,
    port: 5173,
    open: true,
    cors: true,
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    target: 'es2019',
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: 'assets/js/[name]-[hash:8].js',
        chunkFileNames: 'assets/js/[name]-[hash:8].chunk.js',
        assetFileNames: 'assets/[ext]/[name]-[hash:8].[ext]',
        manualChunks: undefined
      }
    }
  },
  preview: {
    host: true,
    port: 4173,
    open: true
  },
  optimizeDeps: {
    disabled: false
  }
});
