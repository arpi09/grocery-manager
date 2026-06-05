import type { MessageKey } from '$lib/i18n/messages';

export type NewsIllustrationId = 'launch' | 'scan' | 'onboarding' | 'recipe' | 'push' | 'inventory-table';

export interface AppNewsItem {
	id: string;
	/** ISO date (YYYY-MM-DD), newest first in APP_NEWS_ITEMS */
	date: string;
	illustration: NewsIllustrationId;
	titleKey: MessageKey;
	bodyKey: MessageKey;
	versionLabelKey?: MessageKey;
	detailBodyKey?: MessageKey;
}

/** Changelog milestones — add new entries at the top. Copy lives in i18n (`news.items.*`). */
export const APP_NEWS_ITEMS: AppNewsItem[] = [
	{
		id: 'launch-v1',
		date: '2026-06-01',
		illustration: 'launch',
		versionLabelKey: 'news.items.launch.version',
		titleKey: 'news.items.launch.title',
		bodyKey: 'news.items.launch.body',
		detailBodyKey: 'news.items.launch.detail'
	}
];
