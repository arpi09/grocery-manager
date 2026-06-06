<script lang="ts">
	import { page } from '$app/state';
	import { t, getLocale } from '$lib/i18n';
	import { subscribeNarrowViewport } from '$lib/utils/use-narrow-viewport';
	import { markFirstRecipeWinIfNeeded } from '$lib/utils/first-recipe-celebration';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import RecipeSuggestionCard from '$lib/components/molecules/RecipeSuggestionCard.svelte';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
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
	let isNarrowViewport = $state(false);
	let loading = $state(false);
	let preferences = $state('');
	let portions = $state(DEFAULT_RECIPE_PORTIONS);
	let mealIntent = $state<MealIntent>(DEFAULT_MEAL_INTENT);
	let recipes = $state<RecipeSuggestion[]>([]);
	let selectedRecipeIndex = $state(0);
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);
	let addingMissingKey = $state<string | null>(null);
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);

	const allMissingIngredients = $derived(
		dedupeMissingIngredients(recipes.map((recipe) => recipe.missingIngredients))
	);
	const hasResults = $derived(recipes.length > 0);
	const selectedRecipe = $derived(recipes[selectedRecipeIndex] ?? null);
	const showRecipePicker = $derived(recipes.length > 1);
	const modalVariant = $derived(isNarrowViewport ? 'sheet' : 'center');

	$effect(() =>
		subscribeNarrowViewport((matches) => {
			isNarrowViewport = matches;
		})
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
		feedbackBanner = null;
		selectedRecipeIndex = 0;

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
				showClientToast(t('recipe.firstWinToast'), { variant: 'success' });
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
		showClientToast(presented.message, {
			variant: presented.tone === 'error' ? 'error' : presented.tone === 'warning' ? 'info' : 'success'
		});
		feedbackBanner = presented;
		addingMissingKey = null;
	}

	function addRecipeMissing(recipe: RecipeSuggestion) {
		return addMissingToList(recipe.missingIngredients, recipe.title);
	}

	function addAllMissing() {
		return addMissingToList(allMissingIngredients, '__all__');
	}

	function closeAssistant() {
		open = false;
	}

	function selectRecipe(index: number) {
		selectedRecipeIndex = index;
	}
</script>

<Modal
	open={open}
	onClose={closeAssistant}
	variant={modalVariant}
	nested
	title={t('recipe.title')}
	panelClass="recipe-assistant-panel"
	bodyClass="recipe-assistant-body"
	data-testid="recipe-assistant-dialog"
>
	{#if hasResults}
		<details class="settings-disclosure">
			<summary>{t('recipe.settingsToggle')}</summary>
			<div class="settings-body">
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
					rows="2"
					maxlength="300"
					bind:value={preferences}
					placeholder={t('recipe.preferencesPlaceholder')}
				></textarea>

				<div class="actions">
					<Button
						type="button"
						onclick={generateRecipes}
						loading={loading}
						loadingLabel={t('common.thinking')}
						fullWidth
					>
						{t('recipe.generateBtn')}
					</Button>
				</div>
			</div>
		</details>
	{:else}
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
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if hasResults}
		{#if feedbackBanner}
			<AddMissingFeedback feedback={feedbackBanner} />
		{/if}
		{#if canEdit && allMissingIngredients.length > 0}
			<div class="results-actions">
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
			</div>
		{/if}

		{#if showRecipePicker}
			<div
				class="recipe-picker"
				role="tablist"
				aria-label={t('recipe.suggestionPickerAria')}
				data-testid="recipe-suggestion-picker"
			>
				{#each recipes as recipe, index (recipe.title)}
					<button
						type="button"
						class="recipe-chip"
						class:active={selectedRecipeIndex === index}
						role="tab"
						aria-selected={selectedRecipeIndex === index}
						onclick={() => selectRecipe(index)}
					>
						{recipe.title}
					</button>
				{/each}
			</div>
		{/if}

		{#if selectedRecipe}
			<div class="result-panel" role="tabpanel">
				<RecipeSuggestionCard
					title={selectedRecipe.title}
					whyItFits={selectedRecipe.whyItFits}
					ingredientsToUse={selectedRecipe.ingredientsToUse}
					missingIngredients={selectedRecipe.missingIngredients}
					steps={selectedRecipe.steps}
					{portions}
					{canEdit}
					addingMissing={addingMissingKey === selectedRecipe.title}
					onAddMissing={() => addRecipeMissing(selectedRecipe)}
				/>
			</div>
		{/if}
	{/if}
</Modal>


<style>
	:global(.recipe-assistant-panel) {
		width: min(760px, calc(100vw - 2 * var(--space-md)));
		max-height: min(92dvh, 52rem);
	}

	:global(.recipe-assistant-panel.modal-panel--sheet) {
		width: 100%;
		max-height: min(100dvh, 52rem);
	}

	:global(.recipe-assistant-body) {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
	}

	:global(.recipe-assistant-panel .actions) {
		position: sticky;
		bottom: 0;
		z-index: 1;
		padding-top: var(--space-sm);
		background: linear-gradient(
			to top,
			var(--color-surface) 72%,
			color-mix(in srgb, var(--color-surface) 0%, transparent)
		);
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

	.settings-disclosure {
		margin-bottom: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.settings-disclosure summary {
		min-height: 2.75rem;
		padding: var(--space-sm) var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.settings-disclosure summary::-webkit-details-marker {
		display: none;
	}

	.settings-body {
		padding: 0 var(--space-md) var(--space-md);
		border-top: 1px solid var(--color-border);
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
		margin-bottom: 0;
	}

	.batch-action {
		margin-bottom: var(--space-md);
	}

	.results-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	@media (max-width: 899px) {
		:global(.recipe-assistant-panel .batch-action),
		:global(.recipe-assistant-panel .results-actions) {
			position: sticky;
			bottom: 0;
			z-index: 1;
			margin-bottom: 0;
			padding-top: var(--space-sm);
			padding-bottom: env(safe-area-inset-bottom, 0);
			background: linear-gradient(
				to top,
				var(--color-surface) 78%,
				color-mix(in srgb, var(--color-surface) 0%, transparent)
			);
		}

		.settings-disclosure {
			margin-bottom: var(--space-sm);
		}

		.recipe-picker {
			margin-bottom: var(--space-sm);
		}
	}

	.note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
	}

	.recipe-picker {
		display: flex;
		gap: var(--space-xs);
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
		margin-bottom: var(--space-md);
		padding: 0 1px 2px;
		scroll-snap-type: x proximity;
	}

	.recipe-picker::-webkit-scrollbar {
		display: none;
	}

	.recipe-chip {
		flex: 0 0 auto;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0.45rem 0.9rem;
		min-height: 2.75rem;
		max-width: 14rem;
		scroll-snap-align: start;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font: inherit;
		font-weight: 600;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.recipe-chip:hover {
		color: var(--color-text);
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
	}

	.recipe-chip.active {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: #fff;
	}

	.result-panel {
		min-height: 0;
	}

	@media (max-width: 899px) {
		.intent-presets {
			grid-template-columns: 1fr;
		}

		.intent-preset {
			flex-direction: row;
			justify-content: center;
			min-height: 2.75rem;
		}
	}
</style>

