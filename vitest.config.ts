import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/model-routing.spec.ts',
      'tests/bug-fixes.spec.ts',
      'tests/lazy-loading.spec.ts',
      'tests/round-tracker-coverage.spec.ts',
      'tests/yaml-frontmatter-env-bug.spec.ts',
      'tests/json-export-bug.spec.ts'
    ], // Only vitest unit tests, not Playwright e2e tests
    exclude: [
      'node_modules/**',
      'dist/**',
      '.{idea,git,cache,output,temp}/**',
      '{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
    ],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70
      }
    }
  }
});
