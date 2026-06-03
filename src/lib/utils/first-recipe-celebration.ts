const STORAGE_PREFIX = 'home-pantry-first-recipe-win';

function storageKey(userId: string): string {
	return `${STORAGE_PREFIX}:${userId}`;
}

/** True the first time the user successfully generates at least one recipe idea. */
export function markFirstRecipeWinIfNeeded(userId: string | null | undefined): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	const key = storageKey(userId);
	if (localStorage.getItem(key) === '1') {
		return false;
	}

	localStorage.setItem(key, '1');
	return true;
}
