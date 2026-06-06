<script lang="ts">
	import { t } from '$lib/i18n';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { RecipeStep } from '$lib/domain/recipe';

	interface Props {
		steps: RecipeStep[];
		recipeTitle?: string;
	}

	let { steps, recipeTitle }: Props = $props();

	const hasSteps = $derived(steps.length > 0);
</script>

{#if hasSteps}
	<section class="timeline" aria-label={t('recipe.stepsAria', { title: recipeTitle ?? '' })}>
		<h2 class="timeline-heading">{t('recipe.stepsTitle')}</h2>
		<ol class="timeline-list">
			{#each steps as step, index (index)}
				<li class="timeline-item">
					<div class="timeline-marker" aria-hidden="true">
						<span class="step-num">{index + 1}</span>
					</div>
					<div class="timeline-content">
						<div class="step-header">
							<span class="step-label">{t('recipe.stepLabel', { number: index + 1 })}</span>
							{#if step.minutes}
								<Badge tone="default">{t('recipe.minutesBadge', { count: step.minutes })}</Badge>
							{/if}
						</div>
						<p class="step-text">{step.instruction}</p>
					</div>
				</li>
			{/each}
		</ol>
	</section>
{/if}

<style>
	.timeline {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.timeline-heading {
		margin: 0;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.timeline-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.timeline-item {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.timeline-marker {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.step-num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
		font-size: 0.875rem;
		font-weight: 700;
	}

	.timeline-content {
		flex: 1;
		min-width: 0;
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.step-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-xs);
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.step-text {
		margin: 0;
		font-size: 1rem;
		line-height: 1.55;
	}
</style>
