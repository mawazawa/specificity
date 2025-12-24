import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/model-routing.spec.ts'], // Only unit tests, not Playwright e2e tests
    exclude: [
      'tests/**/!(model-routing).spec.ts', // Exclude all other spec files (Playwright e2e)
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
