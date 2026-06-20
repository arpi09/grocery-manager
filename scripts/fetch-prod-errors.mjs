/**
 * Login to prod admin and fetch recent error log entries.
 * Usage: node scripts/fetch-prod-errors.mjs [baseUrl] [limit]
 *
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD in .env (prod admin credentials).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadEnv() {
	const path = join(process.cwd(), '.env');
	try {
		const raw = readFileSync(path, 'utf8');
		for (const line of raw.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eq = trimmed.indexOf('=');
			if (eq === -1) continue;
			const key = trimmed.slice(0, eq).trim();
			let value = trimmed.slice(eq + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			if (process.env[key] === undefined) {
				process.env[key] = value;
			}
		}
	} catch {
		// ignore
	}
}

loadEnv();

const base = (process.argv[2] ?? 'https://skaffu.com').replace(/\/$/, '');
const limit = Number(process.argv[3] ?? 50);
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD?.trim();

if (!email || !password) {
	console.error('ADMIN_EMAIL and ADMIN_PASSWORD required in .env');
	process.exit(1);
}

function extractSessionCookie(setCookieHeaders) {
	const parts = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
	for (const header of parts) {
		if (!header) continue;
		const match = header.match(/auth_session=([^;]+)/);
		if (match) return `auth_session=${match[1]}`;
	}
	return null;
}

const warmup = await fetch(`${base}/login`, { redirect: 'manual' });
const warmupCookies = warmup.headers.getSetCookie?.() ?? [];
const cookieJar = warmupCookies.map((c) => c.split(';')[0]).filter(Boolean).join('; ');

const loginRes = await fetch(`${base}/login?/login`, {
	method: 'POST',
	headers: {
		'content-type': 'application/x-www-form-urlencoded',
		accept: 'application/json',
		origin: base,
		referer: `${base}/login`,
		...(cookieJar ? { cookie: cookieJar } : {})
	},
	body: new URLSearchParams({ email, password, redirectTo: '/admin' }).toString(),
	redirect: 'manual'
});

const loginSetCookie = loginRes.headers.getSetCookie?.() ?? [];
const allCookies = [...warmupCookies, ...loginSetCookie].map((c) => c.split(';')[0]).filter(Boolean);
const sessionCookie =
	allCookies.find((c) => c.startsWith('auth_session=')) ?? extractSessionCookie(loginSetCookie);

if (!sessionCookie) {
	console.error('Login failed — no auth_session cookie', loginRes.status);
	const text = await loginRes.text();
	console.error(text.slice(0, 500));
	process.exit(1);
}

const errorsRes = await fetch(`${base}/api/admin/data?section=errors&limit=${limit}`, {
	headers: { cookie: sessionCookie, accept: 'application/json' }
});

if (!errorsRes.ok) {
	console.error('Errors fetch failed', errorsRes.status, await errorsRes.text());
	process.exit(1);
}

const payload = await errorsRes.json();
console.log(JSON.stringify(payload, null, 2));
