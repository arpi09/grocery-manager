<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import type { HouseholdInsight } from '$lib/domain/household-insights';
	import { t } from '$lib/i18n';

	interface Props {
		highlights: HouseholdInsight[];
	}

	let { highlights }: Props = $props();

	const iconByKind: Record<HouseholdInsight['kind'], FeatureIconId> = {
		top_product: 'shopping',
		shopping_rhythm: 'clock',
		favorite_store: 'receipt',
		expiring_soon: 'alert',
		zero_waste_streak: 'sparkle',
		planned_meals: 'home',
		saved_value: 'check',
		pantry_variety: 'box'
	};

	function titleFor(insight: HouseholdInsight): string {
		switch (insight.kind) {
			case 'top_product':
				return t('stats.insights.topProduct.title');
			case 'shopping_rhythm':
				return t('stats.insights.shoppingRhythm.title');
			case 'favorite_store':
				return t('stats.insights.favoriteStore.title');
			case 'expiring_soon':
				return t('stats.insights.expiringSoon.title');
			case 'zero_waste_streak':
				return t('stats.insights.zeroWaste.title');
			case 'planned_meals':
				return t('stats.insights.plannedMeals.title');
			case 'saved_value':
				return t('stats.insights.savedValue.title');
			case 'pantry_variety':
				return t('stats.insights.pantryVariety.title');
		}
	}

	function valueFor(insight: HouseholdInsight): string {
		switch (insight.kind) {
			case 'top_product':
				return insight.productName;
			case 'shopping_rhythm':
				return t('stats.insights.shoppingRhythm.value', { days: insight.avgDays });
			case 'favorite_store':
				return insight.storeLabel;
			case 'expiring_soon':
				return t('stats.insights.expiringSoon.value', { count: insight.count });
			case 'zero_waste_streak':
				return t('stats.insights.zeroWaste.value', { weeks: insight.weeks });
			case 'planned_meals':
				return t('stats.insights.plannedMeals.value', { count: insight.count });
			case 'saved_value':
				return t('stats.insights.savedValue.value', { sek: insight.savedSek });
			case 'pantry_variety':
				return t('stats.insights.pantryVariety.value', { count: insight.distinctProducts });
		}
	}

	function detailFor(insight: HouseholdInsight): string {
		switch (insight.kind) {
			case 'top_product':
				return t('stats.insights.topProduct.detail', { count: insight.purchaseCount });
			case 'shopping_rhythm':
				return t('stats.insights.shoppingRhythm.detail', { count: insight.tripCount });
			case 'favorite_store':
				return t('stats.insights.favoriteStore.detail', { percent: insight.sharePercent });
			case 'expiring_soon':
				return t('stats.insights.expiringSoon.detail');
			case 'zero_waste_streak':
				return t('stats.insights.zeroWaste.detail');
			case 'planned_meals':
				return t('stats.insights.plannedMeals.detail');
			case 'saved_value':
				return t('stats.insights.savedValue.detail', { count: insight.consumedCount });
			case 'pantry_variety':
				return t('stats.insights.pantryVariety.detail');
		}
	}
</script>

<section class="highlights" aria-labelledby="statistik-highlights-heading">
	<div class="highlights-header">
		<h2 id="statistik-highlights-heading" class="highlights-title">{t('stats.insights.sectionTitle')}</h2>
		<p class="highlights-lead">{t('stats.insights.sectionLead')}</p>
	</div>

	{#if highlights.length === 0}
		<Card class="highlights-empty">
			<p>{t('stats.insights.empty')}</p>
		</Card>
	{:else}
		<ul class="highlights-grid" data-testid="statistik-highlights">
			{#each highlights as insight (insight.kind)}
				<li>
					<Card class="insight-card">
						<div class="insight-icon" aria-hidden="true">
							<FeatureIcon id={iconByKind[insight.kind]} size={20} />
						</div>
						<p class="insight-label">{titleFor(insight)}</p>
						<p class="insight-value">{valueFor(insight)}</p>
						<p class="insight-detail">{detailFor(insight)}</p>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.highlights {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.highlights-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.highlights-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 700;
	}

	.highlights-lead {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.highlights-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: var(--space-md);
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	:global(.insight-card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-height: 7.5rem;
		padding: var(--space-md);
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)),
			var(--color-surface)
		);
	}

	:global(.highlights-empty) {
		padding: var(--space-md);
	}

	:global(.highlights-empty) p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.insight-icon {
		display: flex;
		color: var(--color-primary);
	}

	.insight-label {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	.insight-value {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 800;
		line-height: 1.25;
		color: var(--color-text);
		word-break: break-word;
	}

	.insight-detail {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	@media (min-width: 768px) {
		.highlights-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 479px) {
		.highlights-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
