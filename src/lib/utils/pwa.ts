/** localStorage key — dismissible install banner on /hem */
export const INSTALL_BANNER_DISMISSED_KEY = 'home-pantry-install-banner-dismissed';

/** Re-show banner after this interval (matches landing variant cookie TTL). */
export const INSTALL_BANNER_DISMISS_MS = 90 * 24 * 60 * 60 * 1000;

export type InstallPromptOutcome = 'accepted' | 'dismissed' | 'unavailable';

export interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const installPromptListeners = new Set<() => void>();

function notifyInstallPromptListeners(): void {
	for (const listener of installPromptListeners) {
		listener();
	}
}

/** Call once on the client (e.g. root layout onMount). */
export function initPwaInstallListeners(): void {
	if (typeof window === 'undefined') {
		return;
	}

	window.addEventListener('beforeinstallprompt', (event) => {
		event.preventDefault();
		deferredInstallPrompt = event as BeforeInstallPromptEvent;
		notifyInstallPromptListeners();
	});

	window.addEventListener('appinstalled', () => {
		deferredInstallPrompt = null;
		notifyInstallPromptListeners();
	});
}

export function subscribeInstallPrompt(listener: () => void): () => void {
	installPromptListeners.add(listener);
	return () => installPromptListeners.delete(listener);
}

export function canTriggerInstallPrompt(): boolean {
	return deferredInstallPrompt !== null;
}

export async function triggerInstallPrompt(): Promise<InstallPromptOutcome> {
	if (!deferredInstallPrompt) {
		return 'unavailable';
	}

	const prompt = deferredInstallPrompt;
	deferredInstallPrompt = null;
	notifyInstallPromptListeners();

	await prompt.prompt();
	const { outcome } = await prompt.userChoice;
	return outcome === 'accepted' ? 'accepted' : 'dismissed';
}

/** True when opened from home screen / installed PWA shell. */
export function isStandaloneDisplay(): boolean {
	if (typeof window === 'undefined') {
		return false;
	}

	const nav = navigator as Navigator & { standalone?: boolean };
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		window.matchMedia('(display-mode: fullscreen)').matches ||
		nav.standalone === true
	);
}

export function isIosDevice(): boolean {
	if (typeof navigator === 'undefined') {
		return false;
	}
	return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
	if (typeof navigator === 'undefined') {
		return false;
	}
	return /Android/i.test(navigator.userAgent);
}

export function isMobileDevice(): boolean {
	return isIosDevice() || isAndroidDevice();
}

export function shouldOfferInstallExperience(): boolean {
	return isMobileDevice() && !isStandaloneDisplay();
}

export function isInstallBannerDismissed(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}
	const raw = localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY);
	if (!raw) {
		return false;
	}
	if (raw === '1') {
		return true;
	}
	const dismissedAt = Number(raw);
	if (Number.isNaN(dismissedAt)) {
		return false;
	}
	return Date.now() - dismissedAt < INSTALL_BANNER_DISMISS_MS;
}

export function dismissInstallBanner(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, String(Date.now()));
}
