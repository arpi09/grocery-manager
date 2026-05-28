import { sveltekit } from '@sveltejs/kit/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
	plugins: [sveltekit(), ...(useHttps ? [basicSsl()] : [])],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['**/*.integration.test.ts']
	},
	server: {
		host: true,
		port: 5173
	}
});
