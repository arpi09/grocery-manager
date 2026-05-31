import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			workbox: {
				importScripts: ['push-sw.js']
			},
			includeAssets: ['favicon.svg', 'manifest.webmanifest'],
			manifest: {
				name: 'Home Pantry',
				short_name: 'Home Pantry',
				description:
					'Skanna, lagra och handla smart — kyl, frys och skafferi i en app.',
				theme_color: '#3d6b4f',
				background_color: '#f7f5f0',
				display: 'standalone',
				start_url: '/hem',
				scope: '/',
				lang: 'sv',
				icons: [
					{
						src: '/favicon.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: '/favicon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'any'
					},
					{
						src: '/favicon.svg',
						sizes: '512x512',
						type: 'image/svg+xml',
						purpose: 'maskable'
					}
				]
			},
			/** SW off in dev by default — see docs/PWA.md */
			devOptions: {
				enabled: false
			}
		}),
		...(useHttps ? [basicSsl()] : [])
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['**/*.integration.test.ts'],
		environmentMatchGlobs: [['src/lib/client/**', 'happy-dom']]
	},
	server: {
		host: true,
		port: 5173
	}
});
