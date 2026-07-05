<script lang="ts">
	import { getContext } from 'svelte';
	import { Sparkles } from '@lucide/svelte';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { expiringItemsHref } from '$lib/navigation/context-hrefs';
	import { t } from '$lib/i18n';

	interface Props {
		expiringSoon: InventoryItem[];
		plannedMealCount: number;
	}

	let { expiringSoon, plannedMealCount }: Props = $props();

	const openRecipeIdeas = getContext<(() => void) | undefined>(OPEN_RECIPE_IDEAS);
	const expiringCount = $derived(expiringSoon.length);
	const homeHref = expiringItemsHref();
</script>

{#if openRecipeIdeas}
	<section class="eat-hub-hero" aria-labelledby="eat-hub-heading">
		<div class="header-row">
			<h2 id="eat-hub-heading">{t('planer.eatHubTitle')}</h2>
			<button
				type="button"
				class="generate-btn"
				data-testid="eat-hub-generate"
				data-analytics-id="planer.generate_meal"
				onclick={openRecipeIdeas}
			>
				<Sparkles size={20} strokeWidth={2} aria-hidden="true" />
				<span>{t('planer.generateMeal')}</span>
			</button>
		</div>

		<p class="lead">{t('planer.eatHubLead')}</p>

		<div class="hero-meta">
			<a class="text-action" href="/planer/vecka">{t('planer.contextWeeklyLink')}</a>
			<a class="text-action" href={homeHref} data-testid="planer-expiring-link">
				{t('planer.contextHomeLink')}{#if expiringCount > 0} · {expiringCount}{/if}
			</a>
			{#if plannedMealCount > 0}
				<span class="planned-count">{t('planer.contextPlanned', { count: plannedMealCount })}</span>
			{/if}
		</div>
	</section>
{/if}

<style>
	.eat-hub-hero {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: var(--space-lg);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in srgb, var(--color-secondary) 28%, var(--color-border));
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-secondary) 10%, var(--color-surface)),
			color-mix(in srgb, var(--color-taupe) 8%, var(--color-surface))
		);
		box-shadow: var(--shadow-sm);
	}

	.header-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.header-row h2 {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.lead {
		margin: 0;
		font-size: 0.9375rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.hero-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs) var(--space-md);
	}

	.planned-count {
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.generate-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		min-height: var(--touch-target-min);
		padding: 0 var(--space-lg);
		border: 0;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		align-self: flex-start;
	}

	.generate-btn:hover {
		background: var(--color-primary-hover);
	}

	.generate-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	@media (min-width: 560px) {
		.header-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}

		.generate-btn {
			flex-shrink: 0;
		}
	}
</style>
