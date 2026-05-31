import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.integration.test.ts'],
		hookTimeout: 60_000,
		testTimeout: 60_000,
		fileParallelism: false
	}
});
