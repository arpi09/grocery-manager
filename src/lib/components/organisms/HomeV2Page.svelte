<script lang="ts">
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import {
		homeBriefingForYouMessagePrefix,
		homeBriefingStatusMessageKey,
		selectHomeBriefingForYouCard,
		selectHomeBriefingStatus
	} from '$lib/domain/home-briefing';
	import { formatCadenceWeekday } from '$lib/domain/household-shopping-cadence';
	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		summary: DashboardSummary;
		intelligence: HomeIntelligenceSnapshot;
		displayName?: string | null;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
	}

	let {
		summary,
		intelligence,
		displayName = null,
		shoppingListCount = 0,
		shoppingCadence = null
	}: Props = $props();

	const locale = $derived(getLocale());
	const useSoonCount = $derived(summary.expiringSoon.length);

	const briefingInput = $derived({
		totalItems: summary.totalItems,
		useSoonCount,
		shoppingListCount,
		shoppingCadence,
		intelligence,
		expiringSoon: summary.expiringSoon,
		recipeSuggestion: null
	});

	const status = $derived(selectHomeBriefingStatus(briefingInput));
	const forYou = $derived(selectHomeBriefingForYouCard(briefingInput));

	const greeting = $derived(
		displayName?.trim()
			? t('home.v6.greeting', { name: displayName.trim() })
			: t('home.v6.greetingFallback')
	);

	const statusLine = $derived.by(() => {
		const key = homeBriefingStatusMessageKey(status);
		if (status.key === 'useSoonAndList') {
			return t(key, {
				useSoonCount: status.useSoonCount ?? 0,
				weekday: formatCadenceWeekday(status.weekday ?? 0, locale)
			});
		}
		if (status.key === 'listReady') {
			return t(key, { weekday: formatCadenceWeekday(status.weekday ?? 0, locale) });
		}
		if (status.key === 'useSoonOnly' || status.key === 'listItems') {
			return t(key, { count: status.count ?? 0 });
		}
		return t(key);
	});

	const forYouKindLabel = $derived(
		forYou ? t(`${homeBriefingForYouMessagePrefix(forYou.kind)}.title`, forYouTitleParams(forYou)) : null
	);

	function forYouTitleParams(card: NonNullable<typeof forYou>): Record<string, string | number> {
		switch (card.kind) {
			case 'recipe':
				return { mealName: card.mealName };
			case 'replenishment':
				return { name: card.suggestion.displayName };
			case 'expiring':
				return { name: card.item.name };
			case 'shopReady':
				return {};
			default:
				return {};
		}
	}
</script>

<div class="home-v2-page" data-testid="home-v2-page">
	<h1 class="greeting">{greeting}</h1>
	<p class="status-line" data-testid="home-v2-status">{statusLine}</p>

	{#if forYou}
		<p class="section-label">{t('home.v6.forYou.sectionLabel')}</p>
		<article class="for-you-stub" data-testid="home-v2-for-you">
			<h2 class="for-you-title">{forYouKindLabel}</h2>
			<p class="for-you-placeholder">{t('home.v6.forYou.illustrationAria')}</p>
		</article>
	{/if}

	<p class="section-label">{t('home.v6.chips.sectionLabel')}</p>
	<div class="chips-stub" data-testid="home-v2-chips" aria-hidden="true"></div>
</div>

<style>
	.home-v2-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		min-width: 0;
	}

	.greeting {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.status-line {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.section-label {
		margin: var(--space-sm) 0 0;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.for-you-stub {
		padding: var(--space-md);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
	}

	.for-you-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.0625rem;
		font-weight: 700;
	}

	.for-you-placeholder {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.chips-stub {
		min-height: 2.5rem;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-full);
	}
</style>
