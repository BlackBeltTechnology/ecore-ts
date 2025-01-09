import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: { sourcemap: true, lib: { entry: resolve(__dirname, 'src/main.ts'), formats: ['es'] } },
  resolve: { alias: { src: resolve('src/') } },
})
