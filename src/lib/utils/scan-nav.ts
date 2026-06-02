/** Build the scan hub URL with a safe return path. */
export function scanHubHref(returnTo: string): string {
	return `/scan?from=${encodeURIComponent(returnTo)}`;
}

/** Return path for sub-flows that should back-navigate to the scan hub first. */
export function scanSubFlowFrom(returnTo: string): string {
	return scanHubHref(returnTo);
}
