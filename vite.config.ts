import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vitest/config';

const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			registerType: 'autoUpdate',
			workbox: {
				importScripts: ['push-sw.js']
			},
			includeAssets: [
				'favicon.svg',
				'manifest.webmanifest',
				'pwa/icon-192.png',
				'pwa/icon-512.png',
				'pwa/apple-touch-icon.png'
			],
			manifest: {
				name: 'Skaffu',
				short_name: 'Skaffu',
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
						src: '/pwa/icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/pwa/icon-512.png',
						sizes: '512x512',
						type: 'image/png',
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
		projects: [
			{
				extends: true,
				test: {
					name: 'client',
					include: ['src/lib/client/**/*.{test,spec}.{js,ts}'],
					environment: 'happy-dom'
				}
			},
			{
				extends: true,
				test: {
					name: 'unit',
					include: [
						'src/**/*.{test,spec}.{js,ts}',
						'tests/unit/**/*.{test,spec}.{js,ts}',
						'scripts/**/*.{test,spec}.mjs'
					],
					exclude: ['**/*.integration.test.ts', 'src/lib/client/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	},
	server: {
		host: true,
		port: 5173
	}
});
