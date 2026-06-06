<script lang="ts">
	import { t } from '$lib/i18n';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import RecipeStepsPanel from '$lib/components/molecules/RecipeStepsPanel.svelte';
	import { totalMinutes, type RecipeStep } from '$lib/domain/recipe';

	interface Props {
		title: string;
		whyItFits: string;
		ingredientsToUse: string[];
		missingIngredients: string[];
		steps: RecipeStep[];
		portions: number;
		canEdit?: boolean;
		addingMissing?: boolean;
		onAddMissing?: () => void;
	}

	let {
		title,
		whyItFits,
		ingredientsToUse,
		missingIngredients,
		steps,
		portions,
		canEdit = false,
		addingMissing = false,
		onAddMissing
	}: Props = $props();

	const stepCount = $derived(steps.length);
	const missingCount = $derived(missingIngredients.length);
	const estimatedMinutes = $derived(totalMinutes(steps));
	const showIngredientsToggle = $derived(
		ingredientsToUse.length + missingIngredients.length > 4
	);
</script>

<article class="recipe-card">
	<header class="recipe-hero">
		<div class="hero-copy">
			<h3 class="recipe-title">{title}</h3>
			<p class="recipe-lead">{whyItFits}</p>
			<div class="meta-row" aria-label={t('recipe.metaAria')}>
				<Badge tone="default">{t('recipe.portionsBadge', { count: portions })}</Badge>
				{#if estimatedMinutes}
					<Badge tone="default">{t('recipe.totalMinutesBadge', { count: estimatedMinutes })}</Badge>
				{/if}
				{#if stepCount > 0}
					<Badge tone="default">{t('recipe.stepCount', { count: stepCount })}</Badge>
				{/if}
				{#if missingCount > 0}
					<Badge tone="warning">
						{t('recipe.missingBadge', { count: missingCount })}
					</Badge>
				{/if}
			</div>
		</div>
		{#if canEdit && missingCount > 0 && onAddMissing}
			<Button
				type="button"
				variant="secondary"
				class="recipe-add-btn"
				loading={addingMissing}
				loadingLabel={t('common.loading')}
				onclick={onAddMissing}
			>
				{t('recipe.addMissingBtnShort', { count: missingCount })}
			</Button>
		{/if}
	</header>

	{#if showIngredientsToggle}
		<details class="ingredients-disclosure">
			<summary>{t('recipe.ingredientsToggle')}</summary>
			<div class="ingredients-body">
				<div class="ingredient-group">
					<span class="ingredient-label">{t('recipe.fromStock')}</span>
					<ul class="ingredient-chips">
						{#each ingredientsToUse as ingredient (ingredient)}
							<li><Badge tone="default">{ingredient}</Badge></li>
						{/each}
					</ul>
				</div>
				<div class="ingredient-group">
					<span class="ingredient-label">{t('planer.missingLabel')}</span>
					<ul class="ingredient-chips">
						{#if missingIngredients.length === 0}
							<li><span class="none-text">{t('common.none')}</span></li>
						{:else}
							{#each missingIngredients as ingredient (ingredient)}
								<li><Badge tone="warning">{ingredient}</Badge></li>
							{/each}
						{/if}
					</ul>
				</div>
			</div>
		</details>
	{:else}
		<section class="ingredients-inline" aria-label={t('recipe.ingredientsAria')}>
			<div class="ingredient-group">
				<span class="ingredient-label">{t('recipe.fromStock')}</span>
				<ul class="ingredient-chips">
					{#each ingredientsToUse as ingredient (ingredient)}
						<li><Badge tone="default">{ingredient}</Badge></li>
					{/each}
				</ul>
			</div>
			<div class="ingredient-group">
				<span class="ingredient-label">{t('planer.missingLabel')}</span>
				<ul class="ingredient-chips">
					{#if missingIngredients.length === 0}
						<li><span class="none-text">{t('common.none')}</span></li>
					{:else}
						{#each missingIngredients as ingredient (ingredient)}
							<li><Badge tone="warning">{ingredient}</Badge></li>
						{/each}
					{/if}
				</ul>
			</div>
		</section>
	{/if}

	<RecipeStepsPanel steps={steps} recipeTitle={title} />
</article>

<style>
	.recipe-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.recipe-hero {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--color-border);
	}

	.hero-copy {
		flex: 1;
		min-width: 0;
	}

	.recipe-title {
		margin: 0;
		font-size: 1.125rem;
		line-height: 1.25;
		letter-spacing: -0.02em;
	}

	.recipe-lead {
		margin: var(--space-xs) 0 var(--space-sm);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
		line-height: 1.45;
	}

	.meta-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.recipe-hero :global(.recipe-add-btn) {
		flex-shrink: 0;
		align-self: flex-start;
	}

	.ingredients-disclosure,
	.ingredients-inline {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.ingredients-disclosure summary {
		min-height: 2.5rem;
		padding: var(--space-xs) 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		list-style: none;
	}

	.ingredients-disclosure summary::-webkit-details-marker {
		display: none;
	}

	.ingredients-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-top: var(--space-xs);
	}

	.ingredient-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.ingredient-label {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	.ingredient-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.none-text {
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	@media (max-width: 899px) {
		.recipe-card {
			padding: var(--space-sm) var(--space-md);
			gap: var(--space-sm);
		}

		.recipe-hero {
			flex-direction: column;
			align-items: stretch;
		}

		.recipe-hero :global(.recipe-add-btn) {
			width: 100%;
		}

		.recipe-title {
			font-size: 1.05rem;
		}

		.recipe-lead {
			margin-bottom: var(--space-xs);
			font-size: 0.875rem;
		}
	}
</style>
