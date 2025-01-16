import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src'],
      exclude: ['src/main.ts'],
    },
    exclude: [...configDefaults.exclude, 'examples/**', 'dist', 'test/benchmarks'],
  },
});
