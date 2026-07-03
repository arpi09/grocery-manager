#!/usr/bin/env node
/**
 * Cross-platform dev server health check (HTTP GET localhost:5173/login).
 */
const port = Number(process.env.DEV_HEALTH_PORT ?? 5173);
const path = process.env.DEV_HEALTH_PATH ?? '/login';
const url = `http://localhost:${port}${path}`;

try {
	const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
	if (res.status === 200 || res.status === 302) {
		console.log(`OK ${url} -> ${res.status}`);
		process.exit(0);
	}
	console.error(`DOWN ${url} -> ${res.status}`);
	process.exit(1);
} catch (err) {
	console.error(`DOWN ${url} -> ${err instanceof Error ? err.message : err}`);
	process.exit(1);
}
