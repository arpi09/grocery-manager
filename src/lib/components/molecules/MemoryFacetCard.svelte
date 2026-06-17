<script lang="ts">
	import MemoryConfidenceBadge from '$lib/components/molecules/MemoryConfidenceBadge.svelte';
	import type { MemoryFacetView } from '$lib/application/household-suggestions.service';
	import type { StorageLocation } from '$lib/domain/location';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { getLocale, t } from '$lib/i18n';

	interface Props {
		facet: MemoryFacetView;
		onSelect: (facet: MemoryFacetView) => void;
	}

	let { facet, onSelect }: Props = $props();

	const locale = $derived(getLocale());

	function locationShortLabel(location: StorageLocation): string {
		return t(`location.${location}Short` as 'location.fridgeShort');
	}

	const title = $derived(`${facet.displayName} · ${locationShortLabel(facet.location)}`);

	const typeLabel = $derived(
		facet.type === 'shelf_life'
			? t('memory.facet.shelfLifeType')
			: facet.type === 'buy_again'
				? t('memory.facet.buyAgainType')
				: t('memory.facet.locationType')
	);

	const primary = $derived(
		facet.type === 'shelf_life' && facet.typicalDays != null
			? t('memory.facet.shelfLifePrimary', { days: facet.typicalDays })
			: facet.type === 'buy_again' && facet.avgIntervalDays
				? t('memory.facet.buyAgainPrimary', { interval: facet.avgIntervalDays })
				: facet.type === 'buy_again'
					? t('memory.facet.buyAgainPrimaryNoCadence', { count: facet.lineCount ?? facet.sampleCount })
					: t('memory.facet.locationPrimary', {
							location: locationLabel(locale, facet.location)
						})
	);

	const statusLabel = $derived(
		facet.feedbackStatus
			? t(`memory.facet.feedbackStatus.${facet.feedbackStatus}` as 'memory.facet.feedbackStatus.confirmed')
			: null
	);
</script>

<button type="button" class="facet-card" data-testid="memory-facet-card" onclick={() => onSelect(facet)}>
	<div class="facet-main">
		<div class="facet-head">
			<span class="type-badge">{typeLabel}</span>
			<span class="title">{title}</span>
		</div>
		<p class="primary">{primary}</p>
		<p class="meta">
			{t('memory.facet.sampleMeta', { count: facet.sampleCount })}
			{#if statusLabel}
				<span aria-hidden="true"> · </span>
				<span class="status-pill">{statusLabel}</span>
			{:else}
				<span aria-hidden="true"> · </span>
				<MemoryConfidenceBadge tier={facet.confidenceTier} />
			{/if}
		</p>
	</div>
	<span class="detail-cta">{t('memory.facet.detailCta')} →</span>
</button>

<style>
	.facet-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		border: none;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface);
		text-align: left;
		cursor: pointer;
	}

	.facet-card:hover {
		background: color-mix(in srgb, var(--color-primary) 4%, var(--color-surface));
	}

	.facet-main {
		min-width: 0;
		flex: 1;
	}

	.facet-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-xs);
	}

	.type-badge {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-secondary);
	}

	.title {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.primary {
		margin: 0;
		font-size: 0.9375rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.status-pill {
		color: var(--color-text-muted);
		font-weight: 600;
	}

	.detail-cta {
		flex-shrink: 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
	}
</style>
