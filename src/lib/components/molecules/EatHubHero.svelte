<script lang="ts">
	import { getContext } from 'svelte';
	import { Sparkles } from '@lucide/svelte';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';
	import ExpandableCopy from '$lib/components/molecules/ExpandableCopy.svelte';
	import { t } from '$lib/i18n';

	const openRecipeIdeas = getContext<(() => void) | undefined>(OPEN_RECIPE_IDEAS);
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
		<ExpandableCopy preview={t('planer.eatHubLeadShort')} class="lead">
			<p>{t('planer.eatHubLead')}</p>
		</ExpandableCopy>
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
		font-size: 0.9375rem;
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
