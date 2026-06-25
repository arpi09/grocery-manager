<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import PantryShelfActions from '$lib/components/molecules/PantryShelfActions.svelte';
	import MissingExpiryFilterChip from '$lib/components/molecules/MissingExpiryFilterChip.svelte';
	import InventoryInsightsPanel from '$lib/components/organisms/InventoryInsightsPanel.svelte';
	import PantryV2EmptyState from '$lib/components/organisms/PantryV2EmptyState.svelte';
	import PantryV2ShelfView from '$lib/components/organisms/PantryV2ShelfView.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import { trackPantryShelfOpened } from '$lib/client/pantry-v2-telemetry';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { buildPantryShelfView, countMissingExpiry, filterInventoryBySearch } from '$lib/domain/pantry-shelf';
	import type { InventoryInsightsSnapshot } from '$lib/server/inventory-insights';
	import { t } from '$lib/i18n';

	interface Props {
		items: InventoryItem[];
		canWrite?: boolean;
		loadFailed?: boolean;
	}

	let { items, canWrite = false, loadFailed = false }: Props = $props();

	let searchQuery = $state('');
	let insightsSnapshot = $state<InventoryInsightsSnapshot | null>(null);
	let insightsLoading = $state(true);
	let insightsDeepening = $state(false);
	let insightsDeepenError = $state<string | null>(null);
	let pantryFixLoading = $state(false);
	let pantryFixMessage = $state<string | null>(null);

	async function runPantryFix() {
		if (!canWrite || pantryFixLoading) return;
		if (!confirm(t('brain.pantryFix.confirm'))) return;

		pantryFixLoading = true;
		pantryFixMessage = null;
		try {
			const response = await fetch('/api/brain/pantry-fix', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inferExpiry: true, suggestMerges: true })
			});
			const payload = (await response.json()) as {
				error?: string;
				fix?: { inferredExpiryCount?: number; mergeSuggestions?: unknown[] };
			};
			if (!response.ok) {
				pantryFixMessage = payload.error ?? t('brain.pantryFix.failed');
				return;
			}
			const inferred = payload.fix?.inferredExpiryCount ?? 0;
			const merges = payload.fix?.mergeSuggestions?.length ?? 0;
			pantryFixMessage = t('brain.pantryFix.success', { inferred, merges });
			await invalidateAll();
		} catch {
			pantryFixMessage = t('brain.pantryFix.failed');
		} finally {
			pantryFixLoading = false;
		}
	}

	async function deepenInsights() {
		insightsDeepening = true;
		insightsDeepenError = null;
		try {
			const response = await fetch('/api/inventory-insights', { method: 'POST' });
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				insightsDeepenError =
					typeof payload?.error === 'string' ? payload.error : t('brain.insights.deepenError');
				return;
			}
			if (payload?.insights) {
				insightsSnapshot = payload.insights as InventoryInsightsSnapshot;
			}
		} catch {
			insightsDeepenError = t('brain.insights.deepenError');
		} finally {
			insightsDeepening = false;
		}
	}

	const filteredItems = $derived(filterInventoryBySearch(items, searchQuery));
	const shelf = $derived(buildPantryShelfView(filteredItems));
	const unfilteredShelf = $derived(buildPantryShelfView(items));
	const showSearchEmpty = $derived(
		searchQuery.trim().length > 0 && shelf.isEmpty && items.length > 0
	);
	const showHouseholdEmpty = $derived(
		!loadFailed && !showSearchEmpty && unfilteredShelf.isEmpty && searchQuery.trim().length === 0
	);
	const missingExpiryCount = $derived(countMissingExpiry(items));
	const missingExpiryHref = '/inventory/all?filter=noExpiry';
	const bulkInferAction = canWrite ? '/inventory/all?/bulkInferExpiry' : null;

	$effect(() => {
		if (!browser) {
			return;
		}

		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				void invalidateAll();
			}
		};

		window.addEventListener('pageshow', onPageShow);
		return () => window.removeEventListener('pageshow', onPageShow);
	});

	$effect(() => {
		if (!browser || loadFailed) return;
		insightsLoading = true;
		void fetch('/api/inventory/insights')
			.then((response) => (response.ok ? response.json() : null))
			.then((payload) => {
				if (payload?.insights) {
					insightsSnapshot = payload.insights as InventoryInsightsSnapshot;
				}
			})
			.catch(() => {
				insightsSnapshot = null;
			})
			.finally(() => {
				insightsLoading = false;
			});
	});

	$effect(() => {
		if (!browser || loadFailed) {
			return;
		}

		trackPantryShelfOpened(unfilteredShelf.totalActiveCount, unfilteredShelf.useSoon.length);
	});
</script>

<div class="pantry-v2-page" data-testid="pantry-v2-page">
	<PantryShelfActions bind:query={searchQuery} {canWrite} returnTo="/inventory" />

	<details class="insights-fold" data-testid="pantry-v2-insights-fold">
		<summary>{t('pantry.v2.insightsSummary')}</summary>
		{#if canWrite}
			<div class="pantry-fix-action">
				<Button
					type="button"
					variant="secondary"
					loading={pantryFixLoading}
					loadingLabel={t('common.loading')}
					onclick={() => void runPantryFix()}
					data-testid="pantry-fix-btn"
				>
					{t('brain.pantryFix.cta')}
				</Button>
				{#if pantryFixMessage}
					<p class="pantry-fix-message" role="status">{pantryFixMessage}</p>
				{/if}
			</div>
		{/if}
		{#if insightsLoading}
			<InventoryInsightsPanel
				loading
				insights={[]}
				missingExpiryCount={0}
				estimatedCount={0}
			/>
		{:else if insightsSnapshot}
			<InventoryInsightsPanel
				insights={insightsSnapshot.insights}
				missingExpiryCount={insightsSnapshot.missingExpiryCount}
				estimatedCount={insightsSnapshot.estimatedCount}
				{canWrite}
				{bulkInferAction}
				onDeepen={deepenInsights}
				deepening={insightsDeepening}
				deepenError={insightsDeepenError}
			/>
		{/if}
	</details>

	{#if !loadFailed && !showHouseholdEmpty && missingExpiryCount > 0}
		<MissingExpiryFilterChip
			count={missingExpiryCount}
			href={missingExpiryHref}
			bulkInferAction={bulkInferAction}
			actionLabel={canWrite ? t('inventory.bulkExpiryAction') : null}
		/>
	{/if}

	{#if loadFailed}
		<button
			type="button"
			class="load-error"
			role="alert"
			data-testid="pantry-v2-load-error"
			onclick={() => void invalidateAll()}
		>
			{t('pantry.v2.error.loadFailed')}
		</button>
	{:else if showSearchEmpty}
		<p class="search-empty" role="status" data-testid="pantry-v2-search-empty">
			{t('inventory.noResults')}
		</p>
	{:else if showHouseholdEmpty}
		<PantryV2EmptyState {canWrite} />
	{:else}
		<PantryV2ShelfView {shelf} />
	{/if}
</div>

<style>
	.pantry-v2-page {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: var(--space-sm);
	}

	.insights-fold {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.insights-fold > summary {
		display: flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.insights-fold > summary::-webkit-details-marker {
		display: none;
	}

	.insights-fold :global(.inventory-insights-panel) {
		padding: 0 var(--space-md) var(--space-md);
	}

	.pantry-fix-action {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: 0 var(--space-md) var(--space-sm);
	}

	.pantry-fix-message {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.search-empty {
		margin: 0;
		padding: var(--space-lg) var(--space-md);
		text-align: center;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.load-error {
		margin: 0;
		padding: var(--space-lg) var(--space-md);
		width: 100%;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-danger) 8%, var(--color-surface));
		color: var(--color-text);
		font: inherit;
		font-size: 0.875rem;
		text-align: center;
		cursor: pointer;
	}

	.load-error:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
