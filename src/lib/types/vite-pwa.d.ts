declare module 'virtual:pwa-info' {
	export const pwaInfo: { webManifest: { linkTag: string } } | undefined;
}

declare module 'virtual:pwa-register' {
	export function registerSW(options?: { immediate?: boolean }): void;
}
