<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import AiLoadingSkeleton from '$lib/components/molecules/AiLoadingSkeleton.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { t } from '$lib/i18n';
	import { recipeDetailHref } from '$lib/utils/recipe-assistant-nav';

	interface Props {
		active: boolean;
		itemsAdded: number;
	}

	let { active, itemsAdded }: Props = $props();

	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let recipes = $state<RecipeIdea[]>([]);
	let shownTracked = $state(false);
	let loadAttempted = $state(false);

	$effect(() => {
		if (!active || loadAttempted) {
			return;
		}
		loadAttempted = true;
		void loadRecipes();
	});

	$effect(() => {
		if (!active || shownTracked || recipes.length === 0) {
			return;
		}
		shownTracked = true;
		void trackProductEvent('activation_recipes_shown', {
			itemsAdded,
			recipeCount: recipes.length
		});
	});

	async function loadRecipes() {
		loading = true;
		errorMessage = null;
		try {
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					maxRecipes: 3,
					mealIntent: 'quick_dinner',
					preferences: 'Just imported from receipt — use what is in pantry now.'
				})
			});
			const payload = (await response.json().catch(() => ({}))) as {
				recipes?: RecipeIdea[];
				error?: string;
				note?: string;
			};
			if (!response.ok) {
				errorMessage = payload.error ?? t('recipe.generateFailed');
				recipes = [];
				return;
			}
			recipes = (payload.recipes ?? []).slice(0, 3);
			if (recipes.length === 0 && payload.note) {
				errorMessage = payload.note;
			}
		} catch {
			errorMessage = t('recipe.generateFailed');
			recipes = [];
		} finally {
			loading = false;
		}
	}

	async function openRecipe(recipe: RecipeIdea) {
		void trackProductEvent('activation_recipe_clicked', {
			recipeId: recipe.id,
			title: recipe.title
		});
		await goto(recipeDetailHref(recipe.id, 'receipt-success'));
	}
</script>

{#if active}
	<section class="activation-recipes" aria-labelledby="activation-recipes-heading" data-testid="activation-recipes-card">
		<h3 id="activation-recipes-heading">{t('receiptImport.activationRecipes.title')}</h3>
		<p class="lead">{t('receiptImport.activationRecipes.lead')}</p>

		{#if loading}
			<AiLoadingSkeleton messageKey="ai.loadingWeekly" />
		{:else if errorMessage && recipes.length === 0}
			<p class="empty-note" role="status">{errorMessage}</p>
			<Button type="button" variant="secondary" fullWidth onclick={() => void goto('/planer')}>
				{t('receiptImport.activationRecipes.ctaPlaner')}
			</Button>
		{:else if recipes.length > 0}
			<ul class="recipe-list">
				{#each recipes as recipe (recipe.id)}
					<li>
						<button type="button" class="recipe-row" onclick={() => void openRecipe(recipe)}>
							<span class="recipe-title">{recipe.title}</span>
							{#if recipe.whyItFits}
								<span class="recipe-why">{recipe.whyItFits}</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style>
	.activation-recipes {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		text-align: left;
	}

	h3 {
		margin: 0;
		font-size: 1.05rem;
		text-align: center;
	}

	.lead {
		margin: 0;
		font-size: 0.9375rem;
		color: var(--color-text-muted);
		text-align: center;
		line-height: 1.5;
	}

	.empty-note {
		margin: 0;
		text-align: center;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	.recipe-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.recipe-row {
		width: 100%;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		padding: var(--space-sm) var(--space-md);
		text-align: left;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-height: var(--touch-target-min);
	}

	.recipe-row:hover {
		background: var(--color-surface-muted);
	}

	.recipe-title {
		font-weight: 600;
		font-size: 0.95rem;
	}

	.recipe-why {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
