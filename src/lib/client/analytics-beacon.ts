import { afterNavigate } from '$app/navigation';
import { browser } from '$app/environment';
import { hasClientAnalyticsConsent } from '$lib/client/cookie-consent';
import { normalizeAnalyticsRoute } from '$lib/domain/analytics-behavior';

const SCROLL_THRESHOLDS = [25, 50, 75, 100] as const;
const FLUSH_INTERVAL_MS = 15_000;
const BEACON_URL = '/api/analytics/beacon';

interface PendingPageView {
	clientId: string;
	route: string;
	enteredAt: number;
	referrerRoute?: string;
	exitedAt?: number;
	durationMs?: number;
}

interface PendingInteraction {
	route: string;
	elementKey: string;
	kind: 'click' | 'scroll_depth';
	value?: number;
	createdAt: number;
}

let initialized = false;
let currentView: PendingPageView | null = null;
let pendingPageViews: PendingPageView[] = [];
let pendingInteractions: PendingInteraction[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
const scrollSentByRoute = new Map<string, Set<number>>();

function generateClientId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `pv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function canTrack(): boolean {
	return browser && hasClientAnalyticsConsent();
}

function currentRoute(): string {
	return normalizeAnalyticsRoute(window.location.pathname);
}

function queueFlush(): void {
	if (!canTrack()) {
		return;
	}
	void flushBeacon();
}

async function flushBeacon(): Promise<void> {
	if (!canTrack()) {
		return;
	}
	if (pendingPageViews.length === 0 && pendingInteractions.length === 0) {
		return;
	}

	const pageViews = pendingPageViews.splice(0, pendingPageViews.length);
	const interactions = pendingInteractions.splice(0, pendingInteractions.length);

	try {
		await fetch(BEACON_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			keepalive: true,
			body: JSON.stringify({ pageViews, interactions })
		});
	} catch {
		pendingPageViews.unshift(...pageViews);
		pendingInteractions.unshift(...interactions);
	}
}

function closeCurrentView(exitedAt = Date.now()): void {
	if (!currentView) {
		return;
	}
	const durationMs = Math.max(0, exitedAt - currentView.enteredAt);
	currentView.exitedAt = exitedAt;
	currentView.durationMs = durationMs;
	pendingPageViews.push({ ...currentView });
	currentView = null;
}

function startPageView(route: string, referrerRoute?: string): void {
	const enteredAt = Date.now();
	currentView = {
		clientId: generateClientId(),
		route,
		enteredAt,
		referrerRoute
	};
}

function onScroll(): void {
	if (!canTrack() || !currentView) {
		return;
	}
	const route = currentView.route;
	const doc = document.documentElement;
	const scrollHeight = doc.scrollHeight - window.innerHeight;
	if (scrollHeight <= 0) {
		return;
	}
	const depth = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
	let sent = scrollSentByRoute.get(route);
	if (!sent) {
		sent = new Set();
		scrollSentByRoute.set(route, sent);
	}
	for (const threshold of SCROLL_THRESHOLDS) {
		if (depth >= threshold && !sent.has(threshold)) {
			sent.add(threshold);
			pendingInteractions.push({
				route,
				elementKey: `scroll:${threshold}`,
				kind: 'scroll_depth',
				value: threshold,
				createdAt: Date.now()
			});
		}
	}
}

function onDocumentClick(event: MouseEvent): void {
	if (!canTrack()) {
		return;
	}
	const target = event.target;
	if (!(target instanceof Element)) {
		return;
	}
	const el = target.closest('[data-analytics-id]');
	if (!el || !(el instanceof HTMLElement)) {
		return;
	}
	const elementKey = el.dataset.analyticsId?.trim();
	if (!elementKey) {
		return;
	}
	pendingInteractions.push({
		route: currentRoute(),
		elementKey,
		kind: 'click',
		createdAt: Date.now()
	});
}

function onVisibilityChange(): void {
	if (document.visibilityState === 'hidden') {
		closeCurrentView();
		queueFlush();
	}
}

export function initAnalyticsBeacon(): void {
	if (!browser || initialized) {
		return;
	}
	initialized = true;

	afterNavigate(({ from, to }) => {
		if (!canTrack() || !to) {
			return;
		}
		const nextRoute = normalizeAnalyticsRoute(to.url.pathname);
		const referrerRoute = from ? normalizeAnalyticsRoute(from.url.pathname) : undefined;
		closeCurrentView();
		startPageView(nextRoute, referrerRoute);
	});

	document.addEventListener('click', onDocumentClick, { capture: true });
	document.addEventListener('scroll', onScroll, { passive: true });
	document.addEventListener('visibilitychange', onVisibilityChange);
	window.addEventListener('pagehide', () => {
		closeCurrentView();
		queueFlush();
	});

	if (canTrack()) {
		startPageView(currentRoute());
	}

	flushTimer = setInterval(() => {
		closeCurrentView();
		queueFlush();
	}, FLUSH_INTERVAL_MS);
}

export function teardownAnalyticsBeaconForTests(): void {
	if (!browser) {
		return;
	}
	document.removeEventListener('click', onDocumentClick, { capture: true });
	document.removeEventListener('scroll', onScroll);
	document.removeEventListener('visibilitychange', onVisibilityChange);
	if (flushTimer) {
		clearInterval(flushTimer);
		flushTimer = null;
	}
	initialized = false;
	currentView = null;
	pendingPageViews = [];
	pendingInteractions = [];
	scrollSentByRoute.clear();
}
