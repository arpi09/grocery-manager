import { error } from '@sveltejs/kit';
import { hasMarketAvatar, marketFirstName } from '$lib/domain/market-profile';
import { expiringShareService, marketChatRepository, marketChatService, expiringShareRepository, pmfService } from '$lib/server/di';
import { guardMarketV01PageLoad } from '$lib/server/market-v01-guard';
import { recordProductEvent } from '$lib/server/product-events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const base = await guardMarketV01PageLoad(event);
	const { params, locals } = event;

	if (!locals.householdId) {
		error(400, 'Household required');
	}

	const preview = await expiringShareService.getNearbySharePreviewForViewer(
		base.user.id,
		locals.householdId,
		params.id,
		{
			viewerPlanTier: locals.planTier,
			viewerRole: base.user.role
		}
	);

	if (!preview) {
		error(404, 'Not found');
	}

	recordProductEvent(pmfService, {
		userId: base.user.id,
		householdId: locals.householdId,
		eventType: 'market_listing_viewed',
		metadata: {
			shareId: params.id,
			itemCount: preview.items.length
		}
	});

	const shareMeta = await expiringShareRepository.findShareForNearbyPush(params.id);
	const sharerUserId = shareMeta?.createdByUserId;
	const [sharerProfiles, sharerRating, sharerReviews] = sharerUserId
		? await Promise.all([
				marketChatRepository.findMarketProfiles([sharerUserId]),
				marketChatRepository.getRatingSummary(sharerUserId),
				marketChatService.listRecentReviewsForUser(sharerUserId, 3)
			])
		: [[], { averageStars: null, ratingCount: 0 }, []];
	const sharerProfile = sharerProfiles[0];

	return {
		...base,
		preview,
		shareId: params.id,
		needsAvatarSetup: !hasMarketAvatar({ avatarUrl: base.user.avatarUrl }),
		sharer: sharerProfile
			? {
					firstName: marketFirstName(sharerProfile),
					avatarUrl: sharerProfile.avatarUrl,
					rating: sharerRating,
					reviews: sharerReviews
				}
			: null
	};
};
