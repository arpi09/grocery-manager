<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		steps: string[];
		recipeTitle?: string;
	}

	let { steps, recipeTitle }: Props = $props();

	const hasSteps = $derived(steps.length > 0);
	const useAccordion = $derived(steps.length > 3);
	let expandedStep = $state<number | null>(0);

	$effect(() => {
		if (steps.length > 0) {
			expandedStep = 0;
		}
	});
</script>

{#if hasSteps}
	<section class="steps" aria-label={t('recipe.stepsAria', { title: recipeTitle ?? '' })}>
		<h4 class="steps-heading">{t('recipe.stepsTitle')}</h4>
		{#if useAccordion}
			<div class="steps-accordion">
				{#each steps as step, index (index)}
					<details
						class="step-panel"
						open={expandedStep === index}
						ontoggle={(event) => {
							const el = event.currentTarget;
							if (el.open) {
								expandedStep = index;
							} else if (expandedStep === index) {
								expandedStep = null;
							}
						}}
					>
						<summary>
							<span class="step-num" aria-hidden="true">{index + 1}</span>
							<span class="step-label">{t('recipe.stepLabel', { number: index + 1 })}</span>
						</summary>
						<p class="step-body">{step}</p>
					</details>
				{/each}
			</div>
		{:else}
			<ol class="steps-list">
				{#each steps as step, index (index)}
					<li>
						<span class="step-num" aria-hidden="true">{index + 1}</span>
						<p class="step-text">{step}</p>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
{/if}

<style>
	.steps {
		margin-top: 0;
	}

	.steps-heading {
		margin: 0 0 var(--space-sm);
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.steps-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: min(18rem, 42vh);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.steps-list li {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}

	.step-num {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.75rem;
		height: 1.75rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
		font-size: 0.8125rem;
		font-weight: 700;
	}

	.step-text {
		margin: 0;
		flex: 1;
		min-width: 0;
		font-size: 0.9375rem;
		line-height: 1.55;
	}

	.steps-accordion {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		max-height: min(18rem, 42vh);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.step-panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		overflow: hidden;
	}

	.step-panel summary {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		cursor: pointer;
		list-style: none;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.step-panel summary::-webkit-details-marker {
		display: none;
	}

	.step-label {
		flex: 1;
		min-width: 0;
	}

	.step-body {
		margin: 0;
		padding: 0 var(--space-md) var(--space-md);
		padding-left: calc(var(--space-md) + 1.75rem + var(--space-sm));
		font-size: 0.9375rem;
		line-height: 1.55;
	}
</style>
