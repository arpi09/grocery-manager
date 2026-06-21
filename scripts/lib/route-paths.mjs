/**
 * Shared SvelteKit route discovery and URL normalization for docs tooling.
 */
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROUTE_FILES = new Set(['+page.svelte', '+page.server.ts', '+server.ts']);

/** @param {string} repoRoot */
export function collectRouteDirs(repoRoot) {
	const routesRoot = join(repoRoot, 'src', 'routes');
	/** @type {Map<string, { hasPage: boolean, hasPageServer: boolean, hasServer: boolean }>} */
	const dirs = new Map();

	function walk(dir) {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const path = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(path);
				continue;
			}
			if (!ROUTE_FILES.has(entry.name)) continue;

			const relDir = relative(routesRoot, dir).replace(/\\/g, '/');
			const key = relDir === '' ? '.' : relDir;
			const meta = dirs.get(key) ?? { hasPage: false, hasPageServer: false, hasServer: false };
			if (entry.name === '+page.svelte') meta.hasPage = true;
			if (entry.name === '+page.server.ts') meta.hasPageServer = true;
			if (entry.name === '+server.ts') meta.hasServer = true;
			dirs.set(key, meta);
		}
	}

	if (existsSync(routesRoot)) walk(routesRoot);
	return dirs;
}

/**
 * Convert a route directory (relative to src/routes) to a URL path.
 * Handles route groups, dynamic params, and (..) break-out segments.
 * @param {string} routeDir
 */
export function dirToUrlPath(routeDir) {
	if (routeDir === '.' || routeDir === '') return '/';

	const parts = routeDir.split('/').filter(Boolean);
	/** @type {string[]} */
	const urlParts = [];

	for (const part of parts) {
		// Route group — omit from URL
		if (/^\([^)]+\)$/.test(part) && !part.includes('..')) continue;

		// Break-out: (..)(..)item → reset path prefix, continue from `item`
		const breakout = part.match(/^((?:\(\.\.\))+)(.*)$/);
		if (breakout) {
			const levels = (breakout[1].match(/\(\.\.\)/g) ?? []).length;
			urlParts.splice(Math.max(0, urlParts.length - levels));
			if (breakout[2]) urlParts.push(breakout[2]);
			continue;
		}

		urlParts.push(part);
	}

	return urlParts.length === 0 ? '/' : `/${urlParts.join('/')}`;
}

/** @param {string} repoRoot */
export function discoverAppRoutes(repoRoot) {
	const dirs = collectRouteDirs(repoRoot);
	/** @type {Map<string, { routeDir: string, hasPage: boolean, hasPageServer: boolean, hasServer: boolean }>} */
	const byUrl = new Map();

	for (const [routeDir] of dirs) {
		const url = dirToUrlPath(routeDir);
		const meta = dirs.get(routeDir);
		if (!meta) continue;
		const existing = byUrl.get(url);
		if (existing) {
			existing.hasPage ||= meta.hasPage;
			existing.hasPageServer ||= meta.hasPageServer;
			existing.hasServer ||= meta.hasServer;
		} else {
			byUrl.set(url, { routeDir, ...meta });
		}
	}

	return byUrl;
}

/** @param {string} urlPath */
export function isApiRoute(urlPath) {
	return urlPath.startsWith('/api/') || urlPath === '/logout' || urlPath.startsWith('/auth/');
}
