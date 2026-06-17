<script lang="ts">
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import EmptyState from '$lib/components/molecules/EmptyState.svelte';
	import PurchaseMemoryCard from '$lib/components/molecules/PurchaseMemoryCard.svelte';
	import Input from '$lib/components/atoms/Input.svelte';
	import Label from '$lib/components/atoms/Label.svelte';
	import { searchPurchaseMemory } from '$lib/client/price-memory';
	import { trackProductEvent } from '$lib/client/product-events';
	import type { PurchaseMemorySearchResult } from '$lib/domain/price-memory';
	import { t } from '$lib/i18n';
	import { scanHubHref } from '$lib/utils/scan-nav';

	let { data } = $props();

	let query = $state('');
	let results = $state<PurchaseMemorySearchResult[]>([]);
	let searched = $state(false);
	let searching = $state(false);

	async function runSearch(event: Event) {
		event.preventDefault();
		const trimmed = query.trim();
		if (!trimmed) return;
		searching = true;
		results = await searchPurchaseMemory(trimmed, 'search');
		searched = true;
		searching = false;
		if (!results.length) {
			void trackProductEvent('price_memory_empty_state_seen', { entryPoint: 'search' });
		}
	}
</script>

<AppLayout user={data.user}>
	<AppHeader
		title={t('priceMemory.page.title')}
		subtitle={t('priceMemory.page.subtitle')}
		backHref="/settings"
		backLabel={t('priceMemory.page.backToSettings')}
	/>
	<PageContainer>
		<div class="price-memory-page">
			<form class="search-form" onsubmit={runSearch}>
				<div class="field">
					<Label for="price-memory-search">{t('priceMemory.page.searchLabel')}</Label>
					<Input
						id="price-memory-search"
						name="q"
						type="search"
						bind:value={query}
						placeholder={t('priceMemory.page.searchPlaceholder')}
						autocomplete="off"
					/>
				</div>
				<button type="submit" class="btn btn-primary search-btn" disabled={searching || !query.trim()}>
					{searching ? t('priceMemory.page.searching') : t('priceMemory.page.searchAction')}
				</button>
			</form>

			{#if searched && results.length === 0}
				<EmptyState
					iconId="receipt"
					title={t('priceMemory.page.emptyTitle')}
					description={t('priceMemory.page.emptyDescription')}
					actionLabel={t('priceMemory.page.emptyScanCta')}
					actionHref={scanHubHref('/settings/price-memory')}
					primaryAnalyticsId="price_memory.empty_scan"
				/>
			{:else if results.length > 0}
				<ul class="results">
					{#each results as result (result.normalizedKey)}
						<li>
							<PurchaseMemoryCard summary={result} entryPoint="search" />
						</li>
					{/each}
				</ul>
			{:else}
				<p class="intro">{t('priceMemory.page.intro')}</p>
			{/if}
		</div>
	</PageContainer>
</AppLayout>

<style>
	.price-memory-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.search-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.search-btn {
		align-self: flex-start;
		min-height: var(--touch-target-min);
	}

	.intro {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
	}

	.results {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
</style>
