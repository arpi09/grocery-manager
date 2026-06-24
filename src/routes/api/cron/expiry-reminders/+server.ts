import { json } from '@sveltejs/kit';
import { isCronAuthorized } from '$lib/server/cron-auth';
import { expiryReminderService, marketChatPushService, marketListingService } from '$lib/server/di';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (!isCronAuthorized(request)) {
		return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
	}

	const [reminders, movingSoon, autoListings, marketChatReminders] = await Promise.all([
		expiryReminderService.runWeeklyReminders(),
		expiryReminderService.runDailyMovingSoonReminders(),
		marketListingService.runAutoListingRefreshBatch(),
		marketChatPushService.runReplyReminders().catch((error) => {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`[cron/expiry-reminders] market chat reply reminders failed: ${message}`);
			return { checked: 0, sent: 0, skipped: 0, failed: 0, error: message };
		})
	]);
	return json({ ok: true, reminders, movingSoon, autoListings, marketChatReminders });
};
