type NavigationRoute = {
	url: URL;
};

/** True when SvelteKit reports an in-flight client navigation worth showing global progress. */
export function isNavigationActive(nav: {
	complete: unknown;
	from?: NavigationRoute | null;
	to?: NavigationRoute | null;
}): boolean {
	if (nav.complete == null) {
		return false;
	}

	if (nav.from && nav.to && nav.from.url.pathname === nav.to.url.pathname) {
		return false;
	}

	return true;
}
