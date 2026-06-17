import type { HomeState } from './home-state';

export type HomeHeroTimeBand = 'morning' | 'midday' | 'evening' | 'night';
export type HeroStatus = 'healthy' | 'expiring' | 'shopping' | 'empty';

export function getHomeHeroTimeBand(date = new Date()): HomeHeroTimeBand {
	const hour = date.getHours();
	if (hour >= 5 && hour <= 10) return 'morning';
	if (hour >= 11 && hour <= 16) return 'midday';
	if (hour >= 17 && hour <= 23) return 'evening';
	return 'night';
}

export function deriveHeroStatus(homeState: HomeState): HeroStatus {
	switch (homeState) {
		case 'steady':
			return 'healthy';
		case 'expiry':
			return 'expiring';
		case 'lista_ready':
			return 'shopping';
		case 'cold':
			return 'empty';
	}
}
