<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import HomeV2BriefingView from '$lib/components/organisms/HomeV2BriefingView.svelte';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import type { HomeBriefingForYouCard } from '$lib/domain/home-briefing';
	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		summary: DashboardSummary;
		intelligence: HomeIntelligenceSnapshot;
		displayName?: string | null;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
		canWrite?: boolean;
		pantryUxV2Enabled?: boolean;
		loadFailed?: boolean;
	}

	let {
		summary,
		intelligence,
		displayName = null,
		shoppingListCount = 0,
		shoppingCadence = null,
		canWrite = false,
		pantryUxV2Enabled = false,
		loadFailed = false
	}: Props = $props();

	let acceptingReplenishment = $state(false);

	async function acceptReplenishment(
		card: Extract<HomeBriefingForYouCard, { kind: 'replenishment' }>
	) {
		if (!canWrite || acceptingReplenishment) return;

		acceptingReplenishment = true;
		try {
			const response = await fetch('/api/replenishment/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					normalizedKey: card.suggestion.normalizedKey,
					surface: 'hem'
				})
			});
			const data = (await response.json()) as { error?: string; name?: string };

			if (!response.ok) {
				showClientToast(data.error ?? t('shopping.v2.memory.acceptFailed'), { variant: 'error' });
				return;
			}

			showClientToast(
				t('shopping.v2.memory.acceptSuccess', { name: data.name ?? card.suggestion.displayName }),
				{ variant: 'success' }
			);
			await invalidateAll();
		} catch {
			showClientToast(t('shopping.v2.memory.acceptFailed'), { variant: 'error' });
		} finally {
			acceptingReplenishment = false;
		}
	}
</script>

<div class="home-v2-page" data-testid="home-v2-page">
	{#if loadFailed}
		<button
			type="button"
			class="load-error"
			role="alert"
			data-testid="home-v2-load-error"
			onclick={() => void invalidateAll()}
		>
			{t('home.v6.error.loadFailed')}
		</button>
	{:else}
		<HomeV2BriefingView
			{summary}
			{intelligence}
			{displayName}
			{shoppingListCount}
			{shoppingCadence}
			{canWrite}
			{pantryUxV2Enabled}
			{acceptingReplenishment}
			onAcceptReplenishment={acceptReplenishment}
		/>
	{/if}
</div>

<style>
	.home-v2-page {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.load-error {
		margin: 0;
		padding: var(--space-lg) var(--space-md);
		width: 100%;
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-danger, #c0392b) 8%, var(--color-surface));
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
