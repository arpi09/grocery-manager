import { execSync } from 'node:child_process';

export default async function globalSetup() {
	const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5190';
	try {
		/* A live reused dev server (reuseExistingServer) watches .svelte-kit/generated —
		   re-running sync mid-flight triggers a reload storm that can crash it. Skip when
		   the server already responds; CI always starts cold, so sync still runs there. */
		const response = await fetch(`${baseURL}/login`, { signal: AbortSignal.timeout(2_000) });
		if (response.ok) return;
	} catch {
		/* No live server — fall through to sync. */
	}
	execSync('npx svelte-kit sync', { stdio: 'inherit', cwd: process.cwd() });
}
