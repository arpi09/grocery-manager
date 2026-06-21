import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor shell loads production SSR app in WebView.
 * Primary deploy stays Firebase App Hosting — no static export.
 * @see docs/APP_STORE.md
 */
const config: CapacitorConfig = {
	appId: 'com.skaffu.app',
	appName: 'Skaffu',
	webDir: 'www',
	server: {
		url: 'https://skaffu.com',
		cleartext: false
	},
	plugins: {
		PushNotifications: {
			presentationOptions: ['badge', 'sound', 'alert']
		}
	}
};

export default config;
