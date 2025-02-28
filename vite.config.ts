import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'sax': ['sax'],
        },
      },
    },
  },
  resolve: {
    alias: {
      src: resolve('src/'),
    },
  },
  plugins: [
    dts(),
  ],
})
