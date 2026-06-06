<script lang="ts">
	import { t } from '$lib/i18n';
	import type { RecipeStep } from '$lib/domain/recipe';

	interface Props {
		steps: RecipeStep[];
		recipeTitle?: string;
	}

	let { steps, recipeTitle }: Props = $props();

	const hasSteps = $derived(steps.length > 0);
</script>

{#if hasSteps}
	<section class="steps" aria-label={t('recipe.stepsAria', { title: recipeTitle ?? '' })}>
		<h4 class="steps-heading">{t('recipe.stepsTitle')}</h4>
		<ol class="steps-list">
			{#each steps as step, index (index)}
				<li>
					<span class="step-num" aria-hidden="true">{index + 1}</span>
					<p class="step-text">{step.instruction}</p>
				</li>
			{/each}
		</ol>
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
</style>
