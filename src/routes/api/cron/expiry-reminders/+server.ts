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
		marketChatPushService.runReplyReminders()
	]);
	return json({ ok: true, reminders, movingSoon, autoListings, marketChatReminders });
};
