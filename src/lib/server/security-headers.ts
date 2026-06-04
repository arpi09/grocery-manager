/** Baseline security headers for HTML and API responses (App Hosting has no CDN WAF layer in-repo). */
export function applySecurityHeaders(response: Response): void {
	const headers = response.headers;
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('X-Frame-Options', 'DENY');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
	headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	if (!headers.has('Content-Security-Policy')) {
		headers.set(
			'Content-Security-Policy',
			"default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-src https://challenges.cloudflare.com; worker-src 'self' blob:"
		);
	}
}
