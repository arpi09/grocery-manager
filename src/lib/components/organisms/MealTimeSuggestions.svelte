<script lang="ts">
	import { getContext } from 'svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import {
		getCurrentMealSlot,
		mealSlotMessageKey,
		type MealSlot
	} from '$lib/domain/meal-slot';
	import type { MessageKey } from '$lib/i18n';
	import { t } from '$lib/i18n';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';

	interface Props {
		hasInventory?: boolean;
	}

	let { hasInventory = false }: Props = $props();

	const openRecipeIdeas = getContext<(() => void) | undefined>(OPEN_RECIPE_IDEAS);

	const mealSlot = $derived(getCurrentMealSlot());

	const slotHints: Record<MealSlot, MessageKey> = {
		breakfast: 'home.mealHintBreakfast',
		lunch: 'home.mealHintLunch',
		dinner: 'home.mealHintDinner',
		evening: 'home.mealHintEvening'
	};
</script>

{#if hasInventory && openRecipeIdeas}
	<section class="meal-time" aria-labelledby="meal-time-heading">
		<header class="header">
			<div>
				<p class="eyebrow">{t(mealSlotMessageKey(mealSlot))}</p>
				<h2 id="meal-time-heading">{t('home.mealSuggestionsTitle')}</h2>
			</div>
			<span class="icon" aria-hidden="true">
				<FeatureIcon id="sparkle" size={22} />
			</span>
		</header>
		<p class="hint">{t(slotHints[mealSlot])}</p>
		<button type="button" class="meal-link" onclick={openRecipeIdeas}>
			{t('home.mealSuggestionsCta')}
		</button>
	</section>
{/if}

<style>
	.meal-time {
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.eyebrow {
		margin: 0 0 var(--space-xs);
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-primary);
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
		letter-spacing: -0.02em;
	}

	.icon {
		display: flex;
		color: var(--color-primary);
		opacity: 0.85;
	}

	.hint {
		margin: var(--space-sm) 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.meal-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		margin-top: var(--space-xs);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-primary);
		font: inherit;
		font-weight: 600;
		font-size: 0.9375rem;
		text-decoration: underline;
		text-underline-offset: 0.15em;
		cursor: pointer;
	}

	.meal-link:hover {
		color: var(--color-primary-hover);
	}
</style>
