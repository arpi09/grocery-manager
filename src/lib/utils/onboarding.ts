/** Current onboarding tour version — bump to show the guide again for returning users. */
export const ONBOARDING_VERSION = 1;

const VERSION_KEY = 'home-pantry-onboarding-version';
const DISMISSED_KEY = 'home-pantry-onboarding-dismissed';

export const ONBOARDING_REPLAY_EVENT = 'home-pantry-onboarding-replay';

const EXCLUDED_PATH_PREFIXES = ['/admin', '/login', '/register'] as const;

export function isOnboardingExcludedPath(pathname: string): boolean {
	return EXCLUDED_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
	);
}

export function shouldShowOnboarding(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}

	const storedVersion = localStorage.getItem(VERSION_KEY);
	if (storedVersion !== String(ONBOARDING_VERSION)) {
		return true;
	}

	return localStorage.getItem(DISMISSED_KEY) !== '1';
}

export function completeOnboarding(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(VERSION_KEY, String(ONBOARDING_VERSION));
	localStorage.setItem(DISMISSED_KEY, '1');
}

/** Skip or finish the tour — never show again for this version on this device. */
export function dismissOnboarding(): void {
	completeOnboarding();
}

export function resetOnboarding(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.removeItem(VERSION_KEY);
	localStorage.removeItem(DISMISSED_KEY);
}

export function requestOnboardingReplay(): void {
	resetOnboarding();
	if (typeof window !== 'undefined') {
		window.dispatchEvent(new CustomEvent(ONBOARDING_REPLAY_EVENT));
	}
}
