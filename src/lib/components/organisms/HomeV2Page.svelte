<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import BrainHomeCard from '$lib/components/molecules/BrainHomeCard.svelte';
	import BrainTimelineCard from '$lib/components/molecules/BrainTimelineCard.svelte';
	import WastePreventedCard from '$lib/components/molecules/WastePreventedCard.svelte';
	import ReplenishmentSection from '$lib/components/organisms/ReplenishmentSection.svelte';
	import HomeV2BriefingView from '$lib/components/organisms/HomeV2BriefingView.svelte';
	import type { BrainScoreSnapshot } from '$lib/domain/brain-score';
	import type { BrainTimelineEntry } from '$lib/domain/brain-timeline';
	import type { WastePreventedSnapshot } from '$lib/domain/waste-prevented';
	import type { DashboardSummary } from '$lib/application/inventory.service';
	import type { HomeIntelligenceSnapshot } from '$lib/application/inventory-intelligence.service';
	import {
		trackForYouCtaTapped,
		trackHomeBriefingOpened
	} from '$lib/client/home-v2-telemetry';
	import type {
		HomeBriefingForYouCard,
		HomeBriefingFunFact,
		HomeBriefingRecipeCard
	} from '$lib/domain/home-briefing';
	import { homeBriefingRecipeCtaDestination } from '$lib/domain/home-briefing-recipe';
	import {
		selectHomeBriefingForYouCard,
		selectHomeBriefingMomentCard,
		selectHomeBriefingStatus,
		type HomeBriefingInput
	} from '$lib/domain/home-briefing';
	import type { HouseholdShoppingCadence } from '$lib/domain/household-shopping-cadence';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		addMissingIngredientsToList,
		presentAddMissingFeedback
	} from '$lib/utils/recipe-add-missing';
	import { getLocale } from '$lib/i18n';

	interface Props {
		summary: DashboardSummary;
		intelligence: HomeIntelligenceSnapshot;
		displayName?: string | null;
		shoppingListCount?: number;
		shoppingCadence?: HouseholdShoppingCadence | null;
		recipeSuggestion?: HomeBriefingRecipeCard | null;
		briefingRecipeChip?: { id: string; title: string } | null;
		briefingFunFact?: HomeBriefingFunFact | null;
		briefingOneLiner?: string | null;
		canWrite?: boolean;
		pantryUxV2Enabled?: boolean;
		shoppingUxV2Enabled?: boolean;
		loadFailed?: boolean;
		brainScore?: BrainScoreSnapshot | null;
		brainFeedbackV1?: boolean;
		brainTimeline?: BrainTimelineEntry[];
		wastePrevented?: WastePreventedSnapshot | null;
	}

	let {
		summary,
		intelligence,
		displayName = null,
		shoppingListCount = 0,
		shoppingCadence = null,
		recipeSuggestion = null,
		briefingRecipeChip = null,
		briefingFunFact = null,
		briefingOneLiner = null,
		canWrite = false,
		pantryUxV2Enabled = false,
		shoppingUxV2Enabled = false,
		loadFailed = false,
		brainScore = null,
		brainFeedbackV1 = false,
		brainTimeline = [],
		wastePrevented = null
	}: Props = $props();

	let acceptingReplenishment = $state(false);
	let briefingTracked = $state(false);

	const briefingInput = $derived<HomeBriefingInput>({
		totalItems: summary.totalItems,
		useSoonCount: summary.expiringSoon.length,
		shoppingListCount,
		shoppingCadence,
		intelligence,
		expiringSoon: summary.expiringSoon,
		recipeSuggestion
	});

	const status = $derived(selectHomeBriefingStatus(briefingInput));
	const forYouCard = $derived(selectHomeBriefingForYouCard(briefingInput));
	const momentCard = $derived(selectHomeBriefingMomentCard(briefingInput));

	onMount(() => {
		if (!browser || briefingTracked || loadFailed) {
			return;
		}
		briefingTracked = true;
		trackHomeBriefingOpened(status.key, forYouCard?.kind ?? null, momentCard?.kind ?? null);
	});

	async function acceptReplenishment(
		card: Extract<HomeBriefingForYouCard, { kind: 'replenishment' }>
	) {
		if (!canWrite || acceptingReplenishment) return;

		trackForYouCtaTapped('replenishment', 'accept');

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

	async function handleRecipeCta(card: HomeBriefingRecipeCard) {
		if (!canWrite) {
			await goto(homeBriefingRecipeCtaDestination(card));
			return;
		}

		const destination = homeBriefingRecipeCtaDestination(card);
		trackForYouCtaTapped('recipe', destination);

		if (card.missingCount > 0) {
			const result = await addMissingIngredientsToList(card.missingIngredients);
			const feedback = presentAddMissingFeedback(getLocale(), result);
			if (!result.ok) {
				showClientToast(feedback.message, { variant: 'error' });
				return;
			}
			if (feedback.tone !== 'success') {
				showClientToast(feedback.message, {
					variant:
						feedback.tone === 'error' ? 'error' : feedback.tone === 'warning' ? 'info' : 'success'
				});
			}
		}

		await goto(destination);
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
		{#if brainScore && brainScore.score > 0}
			<BrainHomeCard snapshot={brainScore} />
		{/if}
		{#if wastePrevented}
			<WastePreventedCard snapshot={wastePrevented} />
		{/if}
		{#if brainTimeline && brainTimeline.length > 0}
			<BrainTimelineCard entries={brainTimeline} />
		{/if}
		{#if intelligence.replenishment.length > 1}
			<ReplenishmentSection
				suggestions={intelligence.replenishment.slice(1)}
				dedupeByKey={intelligence.dedupeByKey}
				canEdit={canWrite}
				surface="hem"
				compact
				brainFeedbackV1={brainFeedbackV1}
			/>
		{/if}
		<HomeV2BriefingView
			{summary}
			{intelligence}
			{displayName}
			{shoppingListCount}
			{shoppingCadence}
			{recipeSuggestion}
			{briefingRecipeChip}
			{briefingFunFact}
			{briefingOneLiner}
			{canWrite}
			{pantryUxV2Enabled}
			{shoppingUxV2Enabled}
			{acceptingReplenishment}
			onAcceptReplenishment={acceptReplenishment}
			onRecipeCta={handleRecipeCta}
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
