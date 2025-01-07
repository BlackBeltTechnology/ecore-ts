import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '',
  resolve: {
    alias: [
      { find: '~', replacement: path.resolve(__dirname, 'src') },
    ],
  },
})