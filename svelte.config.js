import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * Firebase App Hosting URL — still reachable during skaffu.com transition.
 * When ORIGIN is skaffu.com, adapter-node rewrites request URLs to skaffu.com while
 * browsers on hosted.app send that Origin; SvelteKit CSRF must trust it for form POSTs.
 * @see docs/SKAFFU_DOMAIN_MIGRATION.md
 */
const LEGACY_HOSTED_APP_ORIGIN =
	process.env.LEGACY_APP_ORIGIN ??
	'https://home-pantry--home-pantry-4bee5.europe-west4.hosted.app';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		serviceWorker: {
			register: false
		},
		csrf: {
			trustedOrigins: [LEGACY_HOSTED_APP_ORIGIN]
		}
	}
};

export default config;
