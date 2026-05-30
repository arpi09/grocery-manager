<script lang="ts">
	import { getContext } from 'svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import ExpiringSoonSection from '$lib/components/organisms/ExpiringSoonSection.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import { LOCATION_COLORS, type StorageLocation } from '$lib/domain/location';
	import { t, type MessageKey } from '$lib/i18n';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';

	interface Props {
		summary: DashboardSummary;
		canWrite?: boolean;
		displayName?: string | null;
	}

	let { summary, canWrite = false, displayName = null }: Props = $props();

	const openRecipeIdeas = getContext<(() => void) | undefined>(OPEN_RECIPE_IDEAS);

	const returnTo = '/';
	const from = $derived(encodeURIComponent(returnTo));

	const greeting = $derived(
		displayName?.trim()
			? t('home.greeting', { name: displayName.trim() })
			: t('home.greetingNeutral')
	);

	const tagline = $derived(
		summary.totalItems === 0 ? t('home.taglineEmpty') : t('home.tagline')
	);

	const expiringPreview = $derived(summary.expiringSoon.slice(0, 3));
	const expiringOverflow = $derived(Math.max(0, summary.expiringSoon.length - 3));

	const locationIcons: Record<StorageLocation, FeatureIconId> = {
		fridge: 'fridge',
		freezer: 'freezer',
		cupboard: 'cupboard'
	};

	function locationShortLabel(location: StorageLocation): string {
		return t(`location.${location}Short` as MessageKey);
	}
</script>

<section class="home" aria-label={t('home.ariaLabel')}>
	<header class="hero">
		<h1>{greeting}</h1>
		<p class="tagline">{tagline}</p>
	</header>

	{#if summary.totalItems === 0}
		{#if canWrite}
			<EmptyState
				iconId="box"
				title={t('home.emptyTitle')}
				description={t('home.emptyDescription')}
				actionLabel={t('home.emptyAction')}
				actionHref={`/scan?mode=barcode&from=${from}`}
				secondaryActionLabel={t('home.chipManual')}
				secondaryActionHref={`/item/new?from=${from}`}
			/>
		{:else}
			<Card>
				<p class="readonly-empty">{t('home.readonlyEmpty')}</p>
			</Card>
		{/if}
	{:else}
		{#if canWrite}
			<section class="scan-zone" aria-labelledby="home-scan-heading">
				<h2 id="home-scan-heading" class="sr-only">{t('home.scanCardTitle')}</h2>
				<a class="scan-card" href="/scan?mode=barcode&from={from}">
					<span class="scan-icon" aria-hidden="true">
						<FeatureIcon id="barcode" size={22} />
					</span>
					<div class="scan-copy">
						<span class="scan-title">{t('home.scanCardTitle')}</span>
						<span class="scan-subtitle">{t('home.scanCardSubtitle')}</span>
					</div>
					<span class="scan-arrow" aria-hidden="true">→</span>
				</a>
				<div class="chips">
					<a class="chip" href="/scan/kvitto?from={from}">{t('home.chipReceipt')}</a>
					<a class="chip" href="/scan/foto?from={from}">{t('home.chipPhoto')}</a>
					<a class="chip" href="/item/new?from={from}">{t('home.chipManual')}</a>
				</div>
			</section>
		{:else}
			<p class="readonly-hint">{t('home.readonlyHint')}</p>
		{/if}

		<section class="status-zone" aria-labelledby="home-locations-heading">
			<div class="status-header">
				<h2 id="home-locations-heading">{t('home.locationsTitle')}</h2>
				<span class="total-badge">{t('home.totalTracked', { count: summary.totalItems })}</span>
			</div>
			<div class="locations">
				{#each summary.counts as { location, count }}
					<Card href="/inventory/{location}" interactive class="location-card">
						<span
							class="location-icon"
							style="color: {LOCATION_COLORS[location]}"
							aria-hidden="true"
						>
							<FeatureIcon id={locationIcons[location]} size={22} />
						</span>
						<span class="location-name">{locationShortLabel(location)}</span>
						<span class="location-count">{count}</span>
					</Card>
				{/each}
			</div>
		</section>

		{#if expiringPreview.length > 0}
			<div class="expiring-block">
				<ExpiringSoonSection items={expiringPreview} showEmpty={false} />
				{#if expiringOverflow > 0}
					<p class="expiring-more">{t('home.expiringMore', { count: expiringOverflow })}</p>
				{/if}
			</div>
		{/if}
	{/if}

	{#if openRecipeIdeas && summary.totalItems > 0}
		<button type="button" class="recipe-hint" onclick={openRecipeIdeas}>
			<span class="recipe-icon" aria-hidden="true">
				<FeatureIcon id="sparkle" size={20} />
			</span>
			<span class="recipe-copy">
				<span class="recipe-title">{t('home.recipeHint')}</span>
				<span class="recipe-desc">{t('home.recipeHintDescription')}</span>
			</span>
		</button>
	{/if}
</section>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.hero h1 {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.tagline {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.45;
		max-width: 36ch;
	}

	.scan-zone {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.scan-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-primary) 14%, var(--color-surface)),
			var(--color-surface)
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-md);
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.15s,
			box-shadow 0.15s;
	}

	.scan-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(31, 42, 36, 0.12);
		text-decoration: none;
	}

	.scan-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background: var(--color-primary);
		color: #fff;
		border-radius: var(--radius-md);
	}

	.location-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		line-height: 1;
	}

	.scan-copy {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.scan-title {
		font-weight: 700;
		font-size: 1.1rem;
		letter-spacing: -0.02em;
	}

	.scan-subtitle {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.scan-arrow {
		flex-shrink: 0;
		font-size: 1.25rem;
		color: var(--color-primary);
		font-weight: 600;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		min-height: 2.25rem;
		padding: 0.4rem 0.85rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 999px;
		text-decoration: none;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.chip:hover {
		border-color: var(--color-primary);
		background: var(--color-surface-muted);
		text-decoration: none;
	}

	.readonly-hint,
	.readonly-empty {
		margin: 0;
		padding: var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.5;
	}

	.status-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.status-header h2 {
		margin: 0;
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
	}

	.total-badge {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.locations {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-sm);
	}

	:global(.location-card) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-md) var(--space-sm) !important;
		text-align: center;
	}

	.location-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.location-count {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.expiring-block {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.expiring-more {
		margin: 0;
		padding-left: var(--space-xs);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.recipe-hint {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
		padding: var(--space-md) var(--space-lg);
		background: transparent;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		cursor: pointer;
		text-align: left;
		color: inherit;
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.recipe-hint:hover {
		border-color: var(--color-primary);
		background: var(--color-surface-muted);
	}

	.recipe-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-primary);
		opacity: 0.9;
	}

	.recipe-copy {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}

	.recipe-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.recipe-desc {
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	@media (min-width: 560px) {
		.locations {
			gap: var(--space-md);
		}

		:global(.location-card) {
			padding: var(--space-lg) var(--space-md) !important;
		}

		.location-count {
			font-size: 1.5rem;
		}
	}
</style>
