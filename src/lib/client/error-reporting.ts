import { browser } from '$app/environment';

export interface ClientErrorReport {
	message: string;
	stack?: string | null;
	url?: string;
	statusCode?: number | null;
}

const DEDUP_MS = 60_000;
const CHUNK_RELOAD_KEY = 'skaffu-chunk-reload';
let lastKey = '';
let lastAt = 0;

function isChunkLoadError(message: string): boolean {
	return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
		message
	);
}

/** Reload once after deploy when a stale tab requests removed JS chunks. */
function tryReloadOnChunkError(message: string): boolean {
	if (!browser || !isChunkLoadError(message)) {
		return false;
	}
	try {
		if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') {
			return false;
		}
		sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
	} catch {
		return false;
	}
	window.location.reload();
	return true;
}

function shouldReport(message: string, url: string): boolean {
	const key = `${message.slice(0, 120)}|${url}`;
	const now = Date.now();
	if (key === lastKey && now - lastAt < DEDUP_MS) {
		return false;
	}
	lastKey = key;
	lastAt = now;
	return true;
}

function currentUrl(): string {
	if (!browser) {
		return '';
	}
	return `${window.location.pathname}${window.location.search}`;
}

export async function reportClientError(report: ClientErrorReport): Promise<void> {
	if (!browser) {
		return;
	}

	const message = report.message?.trim();
	if (!message) {
		return;
	}

	const url = report.url?.trim() || currentUrl();
	if (isChunkLoadError(message)) {
		tryReloadOnChunkError(message);
		return;
	}
	if (!shouldReport(message, url)) {
		return;
	}

	try {
		await fetch('/api/client-errors', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({
				message,
				stack: report.stack ?? null,
				url,
				statusCode: report.statusCode ?? 500
			})
		});
	} catch {
		// Never block UX because error reporting failed.
	}
}

let initialized = false;

export function initClientErrorReporting(): void {
	if (!browser || initialized) {
		return;
	}
	initialized = true;

	window.addEventListener('vite:preloadError', (event) => {
		event.preventDefault();
		const payload = (event as unknown as { payload?: Error }).payload;
		const message =
			payload instanceof Error
				? payload.message
				: 'Failed to fetch dynamically imported module';
		void reportClientError({ message, url: currentUrl(), statusCode: 500 });
	});

	window.addEventListener('error', (event) => {
		const target = event.error instanceof Error ? event.error : new Error(event.message || 'Script error');
		void reportClientError({
			message: target.message || 'Script error',
			stack: target.stack,
			url: currentUrl(),
			statusCode: 500
		});
	});

	window.addEventListener('unhandledrejection', (event) => {
		const reason = event.reason;
		const message =
			reason instanceof Error
				? reason.message
				: typeof reason === 'string'
					? reason
					: 'Unhandled promise rejection';
		const stack = reason instanceof Error ? reason.stack : null;
		void reportClientError({
			message,
			stack,
			url: currentUrl(),
			statusCode: 500
		});
	});
}
