<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { MarketPublicReview } from '$lib/domain/market-profile';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		reviews: MarketPublicReview[];
	}

	let { reviews }: Props = $props();

	const locale = getLocale();

	function formatReviewDate(value: Date | string): string {
		const date = value instanceof Date ? value : new Date(value);
		return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-GB', {
			dateStyle: 'medium'
		}).format(date);
	}

	function starsLabel(stars: number): string {
		return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 5 - stars));
	}
</script>

{#if reviews.length > 0}
	<section class="review-list" aria-labelledby="market-reviews-heading" data-testid="market-review-list">
		<h3 id="market-reviews-heading">{t('marketV03.recentReviewsTitle')}</h3>
		<ul>
			{#each reviews as review, index (index)}
				<li>
					<Card class="review-card">
						<div class="review-header">
							<span class="review-stars" aria-label={t('marketV03.reviewStarsAria', { stars: review.stars })}>
								{starsLabel(review.stars)}
							</span>
							<span class="review-meta">
								{t('marketV03.reviewFrom', { name: review.raterFirstName })}
								·
								<time datetime={String(review.createdAt)}>{formatReviewDate(review.createdAt)}</time>
							</span>
						</div>
						{#if review.comment}
							<p class="review-comment">{review.comment}</p>
						{/if}
					</Card>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.review-list {
		display: grid;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	h3 {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	:global(.review-card) {
		display: grid;
		gap: var(--space-2xs);
	}

	.review-header {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--space-xs);
	}

	.review-stars {
		color: var(--color-warning, #d4a017);
		letter-spacing: 0.05em;
	}

	.review-meta {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.review-comment {
		margin: 0;
		font-size: 0.875rem;
		white-space: pre-wrap;
	}
</style>
