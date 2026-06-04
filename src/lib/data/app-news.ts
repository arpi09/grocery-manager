import type { MessageKey } from '$lib/i18n/messages';

export type NewsIllustrationId = 'scan' | 'onboarding' | 'recipe' | 'push' | 'inventory-table';

export interface AppNewsItem {
	id: string;
	/** ISO date (YYYY-MM-DD), newest first in APP_NEWS_ITEMS */
	date: string;
	illustration: NewsIllustrationId;
	titleKey: MessageKey;
	bodyKey: MessageKey;
}

/** Changelog milestones — add new entries at the top. Copy lives in i18n (`news.items.*`). */
export const APP_NEWS_ITEMS: AppNewsItem[] = [
	{
		id: 'inventory-table',
		date: '2026-05-18',
		illustration: 'inventory-table',
		titleKey: 'news.items.inventoryTable.title',
		bodyKey: 'news.items.inventoryTable.body'
	},
	{
		id: 'scan-ux',
		date: '2026-04-22',
		illustration: 'scan',
		titleKey: 'news.items.scanUx.title',
		bodyKey: 'news.items.scanUx.body'
	},
	{
		id: 'recipe-modal',
		date: '2026-03-14',
		illustration: 'recipe',
		titleKey: 'news.items.recipeModal.title',
		bodyKey: 'news.items.recipeModal.body'
	},
	{
		id: 'onboarding',
		date: '2026-02-08',
		illustration: 'onboarding',
		titleKey: 'news.items.onboarding.title',
		bodyKey: 'news.items.onboarding.body'
	},
	{
		id: 'push-fix',
		date: '2026-01-20',
		illustration: 'push',
		titleKey: 'news.items.pushFix.title',
		bodyKey: 'news.items.pushFix.body'
	}
];
