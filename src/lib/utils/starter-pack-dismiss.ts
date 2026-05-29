const STORAGE_KEY = 'home-pantry-starter-pack-dismissed';

export function isStarterPackDismissed(): boolean {
	if (typeof localStorage === 'undefined') {
		return false;
	}
	return localStorage.getItem(STORAGE_KEY) === '1';
}

export function dismissStarterPack(): void {
	localStorage.setItem(STORAGE_KEY, '1');
}
