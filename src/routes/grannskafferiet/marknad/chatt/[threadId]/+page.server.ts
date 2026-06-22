import { error } from '@sveltejs/kit';
import { expiringShareRepository, marketChatService } from '$lib/server/di';
import { guardMarketV01PageLoad } from '$lib/server/market-v01-guard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const base = await guardMarketV01PageLoad(event);
	const result = await marketChatService.getThreadDetail(event.params.threadId, base.user.id);

	if (!result.ok) {
		if (result.error === 'not_found') {
			error(404);
		}
		error(403);
	}

	const share = await expiringShareRepository.findShareForNearbyPush(result.data.thread.shareId);
	const listingContext = share
		? {
				shareId: share.id,
				items: share.snapshot.items
			}
		: null;

	return {
		...base,
		thread: result.data.thread,
		messages: result.data.messages,
		counterpart: result.data.counterpart,
		myRating: result.data.myRating,
		counterpartRating: result.data.counterpartRating,
		myMarkedComplete: result.data.myMarkedComplete,
		counterpartMarkedComplete: result.data.counterpartMarkedComplete,
		paymentContext: result.data.paymentContext,
		listingContext
	};
};
