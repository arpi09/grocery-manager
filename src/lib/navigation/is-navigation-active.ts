/** True when SvelteKit reports an in-flight client navigation. */
export function isNavigationActive(nav: { complete: unknown }): boolean {
	return nav.complete != null;
}
