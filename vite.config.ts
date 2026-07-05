import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vitest/config';
import { buildGoogleFontsCssUrl } from './src/lib/design/brand/typography';
import { BRAND_BG, BRAND_PRIMARY, BRAND_PRIMARY_DARK, PWA_ICON_VERSION } from './src/lib/design/brand-colors';

const GOOGLE_FONTS_URL_RE =
	/href="https:\/\/fonts\.googleapis\.com\/css2\?family=DM\+Sans[^"]*"/;

function brandThemeColorPlugin() {
	return {
		name: 'brand-theme-color',
		transformIndexHtml(html: string) {
			const fontsUrl = buildGoogleFontsCssUrl();
			return html
				.replace('#2c4a3e', BRAND_PRIMARY)
				.replace('#4d8f68', BRAND_PRIMARY_DARK)
				.replace(GOOGLE_FONTS_URL_RE, `href="${fontsUrl}"`);
		}
	};
}

const pwaIcon = (path: string) => `${path}?v=${PWA_ICON_VERSION}`;

const useHttps = process.env.HTTPS === 'true';

export default defineConfig({
	plugins: [
		brandThemeColorPlugin(),
		sveltekit(),
		SvelteKitPWA({
			registerType: 'prompt', // client-owned reload, guarded in +layout — autoUpdate loops on a flaky iOS SW
			workbox: {
				importScripts: ['push-sw.js'], cleanupOutdatedCaches: true // purge old precaches so a stale device self-heals
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
				theme_color: BRAND_PRIMARY,
				background_color: BRAND_BG,
				display: 'standalone',
				start_url: '/hem',
				scope: '/',
				lang: 'sv',
				icons: [
					{
						src: pwaIcon('/pwa/icon-192.png'),
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: pwaIcon('/pwa/icon-512.png'),
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: pwaIcon('/pwa/icon-512.png'),
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
						'scripts/**/*.{test,spec}.{js,ts,mjs}'
					],
					exclude: ['**/*.integration.test.ts', 'src/lib/client/**/*.{test,spec}.{js,ts}']
				}
			}
		]
	},
	server: {
		host: true,
		port: 5173,
		watch: {
			/* Agent worktrees under .claude/worktrees carry their own .svelte-kit/tsconfig.json;
			   without this ignore their file changes force full-reloads of every dev server mid-run. */
			ignored: ['**/.claude/**']
		}
	}
});
