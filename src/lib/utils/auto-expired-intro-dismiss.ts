const STORAGE_KEY = 'home-pantry-auto-expired-intro-dismissed';

export function isAutoExpiredIntroDismissed(): boolean {
	if (typeof localStorage === 'undefined') {
		return true;
	}
	return localStorage.getItem(STORAGE_KEY) === '1';
}

export function dismissAutoExpiredIntro(): void {
	if (typeof localStorage === 'undefined') {
		return;
	}
	localStorage.setItem(STORAGE_KEY, '1');
}
