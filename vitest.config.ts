import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
      environment: 'jsdom',
      globals: true,
      setupFiles: ['tests/setup.ts'],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.ts'],
        exclude: ['src/vite-env.d.ts', 'src/main.ts'],
      },
    },
  }),
);
