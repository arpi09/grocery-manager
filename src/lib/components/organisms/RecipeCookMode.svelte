<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import type { RecipeStep } from '$lib/domain/recipe';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface CookMatch {
		inventoryId: string;
		ingredientName: string;
		consumePreset: string;
	}

	interface CookSkipped {
		ingredientName: string;
		reason: string;
	}

	interface Props {
		recipeId: string;
		recipeTitle: string;
		steps: RecipeStep[];
		ingredientsToUse?: string[];
		portions?: number;
		canWrite?: boolean;
	}

	let {
		recipeId,
		recipeTitle,
		steps,
		ingredientsToUse = [],
		portions = 4,
		canWrite = false
	}: Props = $props();

	let currentIndex = $state(0);
	let showConsumePanel = $state(false);
	let consumeLoading = $state(false);
	let consumePreview = $state<{ matches: CookMatch[]; skipped: CookSkipped[] } | null>(null);
	let consumeConfirmed = $state(false);

	const total = $derived(steps.length);
	const currentStep = $derived(steps[currentIndex] ?? null);
	const progressPercent = $derived(total > 0 ? ((currentIndex + 1) / total) * 100 : 0);
	const isFirst = $derived(currentIndex === 0);
	const isLast = $derived(currentIndex >= total - 1);
	const canAiConsume = $derived(canWrite && ingredientsToUse.length > 0);

	function goPrev() {
		if (!isFirst) {
			currentIndex -= 1;
		}
	}

	function goNext() {
		if (isLast) {
			if (canAiConsume) {
				showConsumePanel = true;
				return;
			}
			void goto(`/recept/${recipeId}`);
			return;
		}
		currentIndex += 1;
	}

	function exitCooking() {
		void goto(`/recept/${recipeId}`);
	}

	async function loadConsumePreview() {
		if (consumeLoading || !canAiConsume) return;
		consumeLoading = true;
		try {
			const response = await fetch('/api/brain/recipe-cook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: recipeTitle,
					ingredientsToUse,
					portions,
					apply: false
				})
			});
			const data = (await response.json()) as {
				error?: string;
				matches?: CookMatch[];
				skipped?: CookSkipped[];
			};
			if (!response.ok) {
				showClientToast(data.error ?? t('recipe.cook.consumeFailed'), { variant: 'error' });
				return;
			}
			consumePreview = {
				matches: data.matches ?? [],
				skipped: data.skipped ?? []
			};
		} catch {
			showClientToast(t('recipe.cook.consumeFailed'), { variant: 'error' });
		} finally {
			consumeLoading = false;
		}
	}

	async function confirmConsume() {
		if (consumeLoading || !consumePreview) return;
		consumeLoading = true;
		try {
			const response = await fetch('/api/brain/recipe-cook', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: recipeTitle,
					ingredientsToUse,
					portions,
					apply: true
				})
			});
			const data = (await response.json()) as { error?: string; consumed?: number };
			if (!response.ok) {
				showClientToast(data.error ?? t('recipe.cook.consumeFailed'), { variant: 'error' });
				return;
			}
			consumeConfirmed = true;
			showClientToast(t('recipe.cook.consumeSuccess', { count: data.consumed ?? 0 }), {
				variant: 'success'
			});
			void goto(`/recept/${recipeId}`);
		} catch {
			showClientToast(t('recipe.cook.consumeFailed'), { variant: 'error' });
		} finally {
			consumeLoading = false;
		}
	}

	$effect(() => {
		if (showConsumePanel && !consumePreview && !consumeLoading && !consumeConfirmed) {
			void loadConsumePreview();
		}
	});
</script>

<div class="cook-mode" data-testid="recipe-cook-mode">
	<header class="cook-header">
		<button type="button" class="exit-btn" onclick={exitCooking}>
			{t('recipe.cook.exit')}
		</button>
		<p class="cook-title">{recipeTitle}</p>
	</header>

	{#if showConsumePanel}
		<section class="consume-panel" data-testid="recipe-cook-consume">
			<h2>{t('recipe.cook.consumeTitle')}</h2>
			<p class="consume-lead">{t('recipe.cook.consumeLead')}</p>
			{#if consumeLoading && !consumePreview}
				<p class="consume-loading">{t('common.loading')}</p>
			{:else if consumePreview}
				{#if consumePreview.matches.length > 0}
					<ul class="match-list">
						{#each consumePreview.matches as match (match.inventoryId)}
							<li>{match.ingredientName}</li>
						{/each}
					</ul>
				{/if}
				{#if consumePreview.skipped.length > 0}
					<ul class="skipped-list">
						{#each consumePreview.skipped as skipped, index (`${skipped.ingredientName}:${index}`)}
							<li>
								<span>{skipped.ingredientName}</span>
								<span class="ai-badge">{t('recipe.cook.skippedAi')}</span>
							</li>
						{/each}
					</ul>
				{/if}
				<div class="consume-actions">
					<Button type="button" variant="secondary" onclick={exitCooking}>
						{t('recipe.cook.consumeSkip')}
					</Button>
					<Button
						type="button"
						loading={consumeLoading}
						loadingLabel={t('common.loading')}
						onclick={confirmConsume}
						data-testid="recipe-cook-consume-confirm"
					>
						{t('recipe.cook.consumeConfirm')}
					</Button>
				</div>
			{/if}
		</section>
	{:else}
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
	{/if}
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
		border: none;
		background: none;
		padding: 0.35rem 0.5rem;
		font: inherit;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
	}

	.cook-title {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.progress-wrap {
		height: 4px;
		background: var(--color-surface-muted);
	}

	.progress-bar {
		height: 100%;
		background: var(--color-primary);
		transition: width 0.2s ease;
	}

	.progress-label {
		margin: var(--space-sm) var(--page-padding-x) 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.cook-main {
		flex: 1;
		padding: var(--space-lg) var(--page-padding-x);
	}

	.step-card {
		padding: var(--space-lg);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface-muted);
	}

	.step-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.step-number {
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.step-instruction {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.45;
	}

	.cook-footer {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
		padding: var(--space-md) var(--page-padding-x)
			calc(var(--space-md) + env(safe-area-inset-bottom, 0));
		border-top: 1px solid var(--color-border);
	}

	.consume-panel {
		flex: 1;
		padding: var(--space-lg) var(--page-padding-x);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.consume-panel h2 {
		margin: 0;
		font-size: 1.125rem;
	}

	.consume-lead,
	.consume-loading {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.match-list,
	.skipped-list {
		margin: 0;
		padding-left: 1.1rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.skipped-list li {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.ai-badge {
		display: inline-flex;
		align-items: center;
		padding: 0.1rem 0.35rem;
		border-radius: var(--radius-sm);
		font-size: 0.6875rem;
		font-weight: 700;
		color: var(--color-learning-ai);
		background: color-mix(in srgb, var(--color-learning-ai) 12%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-learning-ai) 30%, var(--color-border));
	}

	.consume-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: auto;
	}
</style>
