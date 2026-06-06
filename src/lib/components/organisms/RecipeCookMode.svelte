<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { RecipeStep } from '$lib/domain/recipe';
	import { t } from '$lib/i18n';

	interface Props {
		recipeId: string;
		recipeTitle: string;
		steps: RecipeStep[];
	}

	let { recipeId, recipeTitle, steps }: Props = $props();

	let currentIndex = $state(0);

	const total = $derived(steps.length);
	const currentStep = $derived(steps[currentIndex] ?? null);
	const progressPercent = $derived(total > 0 ? ((currentIndex + 1) / total) * 100 : 0);
	const isFirst = $derived(currentIndex === 0);
	const isLast = $derived(currentIndex >= total - 1);

	function goPrev() {
		if (!isFirst) {
			currentIndex -= 1;
		}
	}

	function goNext() {
		if (isLast) {
			void goto(`/recept/${recipeId}`);
			return;
		}
		currentIndex += 1;
	}

	function exitCooking() {
		void goto(`/recept/${recipeId}`);
	}
</script>

<div class="cook-mode" data-testid="recipe-cook-mode">
	<header class="cook-header">
		<button type="button" class="exit-btn" onclick={exitCooking}>
			{t('recipe.cook.exit')}
		</button>
		<p class="cook-title">{recipeTitle}</p>
	</header>

	<div class="progress-wrap" aria-hidden="true">
		<div class="progress-bar" style:width="{progressPercent}%"></div>
	</div>
	<p class="progress-label">{t('recipe.cook.progress', { current: currentIndex + 1, total })}</p>

	<main class="cook-main">
		{#if currentStep}
			<div class="step-card" aria-live="polite" aria-atomic="true">
				<div class="step-meta">
					<span class="step-number">{t('recipe.stepLabel', { number: currentIndex + 1 })}</span>
					{#if currentStep.minutes}
						<Badge tone="default">{t('recipe.minutesBadge', { count: currentStep.minutes })}</Badge>
					{/if}
				</div>
				<p class="step-instruction">{currentStep.instruction}</p>
			</div>
		{/if}
	</main>

	<footer class="cook-footer">
		<Button
			type="button"
			variant="secondary"
			class="nav-btn"
			disabled={isFirst}
			onclick={goPrev}
			data-testid="cook-prev"
		>
			{t('recipe.cook.prev')}
		</Button>
		<Button type="button" class="nav-btn" onclick={goNext} data-testid="cook-next">
			{isLast ? t('recipe.cook.done') : t('recipe.cook.next')}
		</Button>
	</footer>
</div>

<style>
	.cook-mode {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		min-height: 100vh;
		background: var(--color-surface);
	}

	.cook-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: calc(var(--space-sm) + env(safe-area-inset-top, 0)) var(--page-padding-x)
			var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.exit-btn {
		min-height: 2.75rem;
		min-width: 2.75rem;
		padding: 0.35rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.cook-title {
		flex: 1;
		min-width: 0;
		margin: 0;
		font-size: 0.9375rem;
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.progress-wrap {
		height: 0.25rem;
		background: var(--color-surface-muted);
	}

	.progress-bar {
		height: 100%;
		background: var(--color-primary);
		transition: width 200ms ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.progress-bar {
			transition: none;
		}
	}

	.progress-label {
		margin: var(--space-sm) var(--page-padding-x) 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.cook-main {
		flex: 1;
		display: flex;
		align-items: center;
		padding: var(--space-lg) var(--page-padding-x);
		min-height: 0;
	}

	.step-card {
		width: 100%;
	}

	.step-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
	}

	.step-number {
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.step-instruction {
		margin: 0;
		font-size: clamp(1.125rem, 4.5vw, 1.5rem);
		line-height: 1.45;
	}

	.cook-footer {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
		padding: var(--space-md) var(--page-padding-x)
			calc(var(--space-md) + env(safe-area-inset-bottom, 0));
		border-top: 1px solid var(--color-border);
		background: var(--color-surface);
	}

	.cook-footer :global(.nav-btn) {
		min-height: 2.75rem;
	}
</style>
