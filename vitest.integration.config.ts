import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.integration.test.ts'],
		exclude: ['src/routes/scan/scan-bulk.integration.test.ts'], // hangs CI quality-integration (see scan-bulk.integration.test.ts)
		hookTimeout: 60_000,
		testTimeout: 60_000,
		// PGlite per-file isolation (createIntegrationDb in beforeAll) — safe to parallelize. Use forks so vi.mock(feature-flags) does not leak across files in a worker.
		fileParallelism: true,
		pool: 'forks'
	}
});
