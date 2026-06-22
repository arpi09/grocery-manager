<script lang="ts">
	import { marketFirstName, type MarketPublicReview, type MarketRatingSummary } from '$lib/domain/market-profile';
	import MarketReviewList from '$lib/components/molecules/MarketReviewList.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		firstName?: string | null;
		displayName?: string | null;
		avatarUrl?: string | null;
		rating: MarketRatingSummary;
		reviews?: MarketPublicReview[];
	}

	let {
		firstName = null,
		displayName = null,
		avatarUrl = null,
		rating,
		reviews = []
	}: Props = $props();

	const resolvedName = $derived(marketFirstName({ marketFirstName: firstName, displayName }));
	const ratingLabel = $derived(
		rating.ratingCount > 0 && rating.averageStars != null
			? t('marketV01.ratingSummary', {
					stars: rating.averageStars.toFixed(1),
					count: rating.ratingCount
				})
			: t('marketV01.ratingNewHere')
	);
</script>

<div class="sharer-profile" data-testid="market-sharer-profile">
	{#if avatarUrl}
		<img class="avatar" src={avatarUrl} alt="" />
	{:else}
		<span class="avatar avatar-fallback" aria-hidden="true">{resolvedName.slice(0, 1).toUpperCase()}</span>
	{/if}
	<div>
		<p class="name">{resolvedName}</p>
		<p class="rating">{ratingLabel}</p>
	</div>
</div>

<MarketReviewList {reviews} />

<style>
	.sharer-profile {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.avatar {
		width: 3rem;
		height: 3rem;
		border-radius: 999px;
		object-fit: cover;
	}

	.avatar-fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		font-weight: 700;
	}

	.name {
		margin: 0;
		font-weight: 700;
	}

	.rating {
		margin: var(--space-2xs) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
