<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		steps: string[];
		recipeTitle?: string;
	}

	let { steps, recipeTitle }: Props = $props();

	const hasSteps = $derived(steps.length > 0);
	const useAccordion = $derived(steps.length > 4);
	let expandedStep = $state<number | null>(null);
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
							<span class="step-num">{index + 1}</span>
							<span class="step-preview">{step}</span>
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
						<span>{step}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
{/if}

<style>
	.steps {
		margin-top: var(--space-sm);
	}

	.steps-heading {
		margin: 0 0 var(--space-xs);
		font-size: 0.8rem;
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
		gap: var(--space-xs);
	}

	.steps-list li {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
		font-size: 0.9rem;
		line-height: 1.45;
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
	}

	.step-num {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.5rem;
		height: 1.5rem;
		border-radius: 999px;
		background: var(--color-surface-muted);
		color: var(--color-primary);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.steps-accordion {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		max-height: min(16rem, 40vh);
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.step-panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		overflow: hidden;
	}

	.step-panel summary {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		padding: var(--space-sm);
		cursor: pointer;
		list-style: none;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.step-panel summary::-webkit-details-marker {
		display: none;
	}

	.step-preview {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.step-body {
		margin: 0;
		padding: 0 var(--space-sm) var(--space-sm);
		padding-left: calc(var(--space-sm) + 1.5rem + var(--space-sm));
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}
</style>
