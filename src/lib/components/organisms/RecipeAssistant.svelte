<script lang="ts">
	import { page } from '$app/state';
	import { t, getLocale } from '$lib/i18n';
	import { markFirstRecipeWinIfNeeded } from '$lib/utils/first-recipe-celebration';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import RecipeStepsPanel from '$lib/components/molecules/RecipeStepsPanel.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { DEFAULT_RECIPE_PORTIONS, DEFAULT_MEAL_INTENT, type MealIntent } from '$lib/domain/recipe';
	import {
		addMissingIngredientsToList,
		dedupeMissingIngredients,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';

	interface RecipeSuggestion {
		title: string;
		whyItFits: string;
		ingredientsToUse: string[];
		missingIngredients: string[];
		steps: string[];
	}

	interface Props {
		open?: boolean;
		canEdit?: boolean;
	}

	let { open = $bindable(false), canEdit = false }: Props = $props();
	let loading = $state(false);
	let preferences = $state('');
	let portions = $state(DEFAULT_RECIPE_PORTIONS);
	let mealIntent = $state<MealIntent>(DEFAULT_MEAL_INTENT);
	let recipes = $state<RecipeSuggestion[]>([]);
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);
	let addingMissingKey = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);

	const allMissingIngredients = $derived(
		dedupeMissingIngredients(recipes.map((recipe) => recipe.missingIngredients))
	);

	function recipeErrorMessage(status: number, serverError?: string): string {
		if (serverError?.trim()) {
			return serverError;
		}
		if (status === 401) {
			return t('recipe.notLoggedIn');
		}
		if (status === 422) {
			return t('recipe.parseFailed');
		}
		if (status === 503) {
			return t('recipe.serviceUnavailable');
		}
		if (status === 502) {
			return t('recipe.reachFailed');
		}
		return t('recipe.generateFailed');
	}

	async function generateRecipes() {
		loading = true;
		errorMessage = null;
		note = null;
		toastMessage = null;
		feedbackBanner = null;

		try {
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					preferences,
					portions,
					mealIntent
				})
			});

			const data = (await response.json()) as {
				error?: string;
				note?: string;
				recipes?: RecipeSuggestion[];
			};

			if (!response.ok) {
				errorMessage = recipeErrorMessage(response.status, data.error);
				recipes = [];
				return;
			}

			recipes = data.recipes ?? [];
			note = data.note ?? null;

			if (recipes.length > 0 && markFirstRecipeWinIfNeeded(page.data.user?.id)) {
				toastMessage = t('recipe.firstWinToast');
			}

			if (recipes.length === 0 && !note) {
				errorMessage = t('recipe.noneGenerated');
			}
		} catch {
			errorMessage = t('recipe.networkError');
			recipes = [];
		} finally {
			loading = false;
		}
	}

	async function addMissingToList(ingredients: string[], actionKey: string) {
		if (!canEdit || ingredients.length === 0) {
			return;
		}

		addingMissingKey = actionKey;
		errorMessage = null;
		feedbackBanner = null;

		const presented = presentAddMissingFeedback(
			getLocale(),
			await addMissingIngredientsToList(ingredients)
		);
		toastMessage = presented.message;
		feedbackBanner = presented;
		addingMissingKey = null;
	}

	function addRecipeMissing(recipe: RecipeSuggestion) {
		return addMissingToList(recipe.missingIngredients, recipe.title);
	}

	function addAllMissing() {
		return addMissingToList(allMissingIngredients, '__all__');
	}

	function dismissToast() {
		toastMessage = null;
	}

	function closeAssistant() {
		open = false;
	}
</script>

<Modal
	{open}
	onClose={closeAssistant}
	variant="center"
	title={t('recipe.title')}
	panelClass="recipe-assistant-panel"
>
	<p class="helper">
		{t('recipe.intro')}
	</p>

	<fieldset class="intent-fieldset">
		<legend class="label">{t('recipe.mealIntentLabel')}</legend>
		<div class="intent-presets" role="group" aria-label={t('recipe.mealIntentAria')}>
			<label class="intent-preset">
				<input type="radio" name="meal-intent" value="quick" bind:group={mealIntent} />
				<span>{t('recipe.mealIntentQuick')}</span>
			</label>
			<label class="intent-preset">
				<input type="radio" name="meal-intent" value="friday" bind:group={mealIntent} />
				<span>{t('recipe.mealIntentFriday')}</span>
			</label>
			<label class="intent-preset">
				<input type="radio" name="meal-intent" value="meal_prep" bind:group={mealIntent} />
				<span>{t('recipe.mealIntentMealPrep')}</span>
			</label>
		</div>
	</fieldset>

	<label class="label" for="recipe-portions">{t('recipe.portions')}</label>
	<input
		id="recipe-portions"
		class="number-input"
		type="number"
		min="1"
		max="8"
		bind:value={portions}
	/>
	<p class="hint">{t('recipe.portionsHint')}</p>

	<label class="label" for="recipe-preferences">{t('recipe.preferences')}</label>
	<textarea
		id="recipe-preferences"
		class="textarea"
		rows="3"
		maxlength="300"
		bind:value={preferences}
		placeholder={t('recipe.preferencesPlaceholder')}
	></textarea>

	<div class="actions">
		<Button type="button" onclick={generateRecipes} loading={loading} loadingLabel={t('common.thinking')} fullWidth>
			{t('recipe.generateBtn')}
		</Button>
	</div>

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if recipes.length > 0}
		{#if feedbackBanner}
			<AddMissingFeedback feedback={feedbackBanner} />
		{/if}
		{#if canEdit && allMissingIngredients.length > 0}
			<div class="batch-action">
				<Button
					type="button"
					loading={addingMissingKey === '__all__'}
					loadingLabel={t('common.loading')}
					onclick={addAllMissing}
					fullWidth
				>
					{t('recipe.addAllMissingBtn', { count: allMissingIngredients.length })}
				</Button>
			</div>
		{/if}

		<div class="result-list">
			{#each recipes as recipe}
				<section class="recipe">
					<div class="recipe-header">
						<h3>{recipe.title}</h3>
						{#if canEdit && recipe.missingIngredients.length > 0}
							<Button
								type="button"
								variant="secondary"
								class="recipe-add-btn"
								loading={addingMissingKey === recipe.title}
								loadingLabel={t('common.loading')}
								onclick={() => addRecipeMissing(recipe)}
							>
								{t('recipe.addMissingBtnShort', { count: recipe.missingIngredients.length })}
							</Button>
						{/if}
					</div>
					<p class="why">{recipe.whyItFits}</p>
					<p><strong>{t('recipe.fromStock')}</strong> {recipe.ingredientsToUse.join(', ')}</p>
					<p class="missing-text">
						<strong>{t('planer.missingLabel')}</strong>
						{recipe.missingIngredients.join(', ') || t('common.none')}
					</p>
					<RecipeStepsPanel steps={recipe.steps} recipeTitle={recipe.title} />
				</section>
			{/each}
		</div>
	{/if}
</Modal>

{#if toastMessage}
	<Toast message={toastMessage} visible={true} onDismiss={dismissToast} />
{/if}

<style>
	:global(.recipe-assistant-panel) {
		width: min(760px, calc(100vw - 2 * var(--space-md)));
	}

	.helper,
	.hint {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.hint {
		margin-top: calc(-1 * var(--space-sm));
	}

	.label {
		display: block;
		margin-bottom: var(--space-xs);
		font-weight: 600;
	}

	.intent-fieldset {
		border: 0;
		margin: 0 0 var(--space-md);
		padding: 0;
	}

	.intent-fieldset .label {
		margin-bottom: var(--space-sm);
	}

	.intent-presets {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-xs);
	}

	.intent-preset {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		padding: 0.5rem 0.35rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		text-align: center;
	}

	.intent-preset:has(input:checked) {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
	}

	.intent-preset input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.number-input {
		width: 5rem;
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		margin-bottom: var(--space-xs);
		color: var(--color-text);
	}

	.textarea {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		margin-bottom: var(--space-md);
		color: var(--color-text);
	}

	.actions {
		margin-bottom: var(--space-md);
	}

	.batch-action {
		margin-bottom: var(--space-md);
	}

	.note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
	}

	.result-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.recipe {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		background: var(--color-surface-muted);
	}

	.recipe-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	h3 {
		margin: 0;
		flex: 1;
		min-width: 0;
	}

	.recipe-header :global(.recipe-add-btn) {
		flex-shrink: 0;
	}

	.why {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
	}

	.missing-text {
		margin: var(--space-xs) 0 var(--space-sm);
	}

	ol {
		margin: var(--space-sm) 0 0;
		padding-left: 1.25rem;
	}
</style>
