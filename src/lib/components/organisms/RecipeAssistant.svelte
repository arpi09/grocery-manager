<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { t, getLocale } from '$lib/i18n';
	import { subscribeNarrowViewport } from '$lib/utils/use-narrow-viewport';
	import { markFirstRecipeWinIfNeeded } from '$lib/utils/first-recipe-celebration';
	import Button from '$lib/components/atoms/Button.svelte';
	import AiLoadingSkeleton from '$lib/components/molecules/AiLoadingSkeleton.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { recipeDetailFromAssistantHref } from '$lib/utils/recipe-assistant-nav';
	import {
		hasRecipeAssistantResults,
		recipeAssistantStore,
		setRecipeAssistantResults
	} from '$lib/utils/recipe-assistant-state.svelte';
	import {
		addMissingIngredientsToList,
		dedupeMissingIngredients,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';
	import { aiServiceErrorMessage } from '$lib/utils/ai-service-error';

	interface Props {
		open?: boolean;
		canEdit?: boolean;
	}

	let { open = $bindable(false), canEdit = false }: Props = $props();
	let isNarrowViewport = $state(false);
	let extraDraft = $state('');

	const pantryCount = $derived(
		typeof page.data.activeInventoryCount === 'number' ? page.data.activeInventoryCount : 0
	);

	const pantryStaleCount = $derived(
		typeof page.data.staleCount === 'number' ? page.data.staleCount : 0
	);

	function addExtraItem() {
		const name = extraDraft.trim().slice(0, 40);
		if (!name) {
			return;
		}
		const key = name.toLowerCase();
		if (recipeAssistantStore.extraItems.some((item) => item.toLowerCase() === key)) {
			extraDraft = '';
			return;
		}
		if (recipeAssistantStore.extraItems.length >= 12) {
			return;
		}
		recipeAssistantStore.extraItems = [...recipeAssistantStore.extraItems, name];
		extraDraft = '';
	}

	function removeExtraItem(name: string) {
		recipeAssistantStore.extraItems = recipeAssistantStore.extraItems.filter(
			(item) => item !== name
		);
	}

	let loading = $state(false);
	let errorMessage = $state<string | null>(null);
	let noResults = $state(false);
	let addingMissingKey = $state<string | null>(null);
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);

	const allMissingIngredients = $derived(
		dedupeMissingIngredients(recipeAssistantStore.recipes.map((recipe) => recipe.missingIngredients))
	);
	const hasResults = $derived(hasRecipeAssistantResults());
	const modalVariant = $derived(isNarrowViewport ? 'sheet' : 'center');

	$effect(() =>
		subscribeNarrowViewport((matches) => {
			isNarrowViewport = matches;
		})
	);

	async function generateRecipes() {
		loading = true;
		errorMessage = null;
		noResults = false;
		feedbackBanner = null;

		try {
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					preferences: recipeAssistantStore.preferences,
					extraItems: recipeAssistantStore.extraItems,
					portions: recipeAssistantStore.portions,
					mealIntent: recipeAssistantStore.mealIntent
				})
			});

			const data = (await response.json()) as {
				error?: string;
				note?: string;
				recipes?: RecipeIdea[];
			};

			if (!response.ok) {
				errorMessage = aiServiceErrorMessage(response.status, data.error);
				setRecipeAssistantResults([], null);
				return;
			}

			const nextRecipes = data.recipes ?? [];
			setRecipeAssistantResults(nextRecipes, data.note ?? null);

			if (nextRecipes.length > 0 && markFirstRecipeWinIfNeeded(page.data.user?.id)) {
				showClientToast(t('recipe.firstWinToast'), { variant: 'success' });
			}

			if (nextRecipes.length === 0 && !recipeAssistantStore.note) {
				noResults = true;
			}
		} catch {
			errorMessage = t('recipe.networkError');
			setRecipeAssistantResults([], null);
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

	function addAllMissing() {
		return addMissingToList(allMissingIngredients, '__all__');
	}

	function closeAssistant() {
		open = false;
	}

	function openRecipe(idea: RecipeIdea) {
		closeAssistant();
		void goto(recipeDetailFromAssistantHref(idea.id));
	}
</script>

{#snippet pantryExtras()}
	<div class="extras-section" data-testid="recipe-extras">
		<p class="extras-honesty">
			{pantryCount === 0
				? t('recipe.extras.emptyPantry')
				: t('recipe.extras.basedOn', { count: pantryCount })}
		</p>
		{#if pantryStaleCount > 0}
			<a class="extras-stale-link" href="/inventory/synk">
				{t('recipe.extras.staleLink', { count: pantryStaleCount })}
			</a>
		{/if}
		{#if recipeAssistantStore.extraItems.length > 0}
			<div class="extras-chips" role="group" aria-label={t('recipe.extras.label')}>
				{#each recipeAssistantStore.extraItems as item (item)}
					<button
						type="button"
						class="extras-chip"
						onclick={() => removeExtraItem(item)}
						aria-label={t('recipe.extras.removeAria', { name: item })}
					>
						{item}
						<span aria-hidden="true">×</span>
					</button>
				{/each}
			</div>
		{/if}
		<div class="extras-row">
			<input
				class="extras-input"
				aria-label={t('recipe.extras.label')}
				placeholder={t('recipe.extras.placeholder')}
				maxlength="40"
				bind:value={extraDraft}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						addExtraItem();
					}
				}}
			/>
			<button type="button" class="extras-add" onclick={addExtraItem}>
				{t('recipe.extras.addBtn')}
			</button>
		</div>
	</div>
{/snippet}

{#snippet settingsForm()}
	<p class="helper">{t('recipe.intro')}</p>

	<fieldset class="intent-fieldset">
		<legend class="label">{t('recipe.mealIntentLabel')}</legend>
		<div class="intent-presets" role="group" aria-label={t('recipe.mealIntentAria')}>
			<label class="intent-preset">
				<input type="radio" name="meal-intent" value="quick" bind:group={recipeAssistantStore.mealIntent} />
				<span>{t('recipe.mealIntentQuick')}</span>
			</label>
			<label class="intent-preset">
				<input type="radio" name="meal-intent" value="friday" bind:group={recipeAssistantStore.mealIntent} />
				<span>{t('recipe.mealIntentFriday')}</span>
			</label>
			<label class="intent-preset">
				<input type="radio" name="meal-intent" value="meal_prep" bind:group={recipeAssistantStore.mealIntent} />
				<span>{t('recipe.mealIntentMealPrep')}</span>
			</label>
		</div>
	</fieldset>

	<details class="advanced-disclosure">
		<summary>{t('recipe.advancedToggle')}</summary>
		<div class="advanced-body">
			<label class="label" for="recipe-portions">{t('recipe.portions')}</label>
			<input
				id="recipe-portions"
				class="number-input"
				type="number"
				min="1"
				max="8"
				bind:value={recipeAssistantStore.portions}
			/>
			<p class="hint">{t('recipe.portionsHint')}</p>

			<label class="label" for="recipe-preferences">{t('recipe.preferences')}</label>
			<textarea
				id="recipe-preferences"
				class="textarea"
				rows="3"
				maxlength="300"
				bind:value={recipeAssistantStore.preferences}
				placeholder={t('recipe.preferencesPlaceholder')}
			></textarea>
		</div>
	</details>

	{@render pantryExtras()}

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
{/snippet}

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
				{@render settingsForm()}
			</div>
		</details>
	{:else}
		{@render settingsForm()}
		{#if loading}
			<AiLoadingSkeleton messageKey="ai.loadingPantry" />
		{/if}
	{/if}

	{#if errorMessage}
		<FeedbackBanner tone="error" message={errorMessage} />
	{/if}

	{#if noResults}
		<FeedbackBanner tone="info" message={t('recipe.noneGenerated')} />
	{/if}

	{#if recipeAssistantStore.note}
		<p class="note">{recipeAssistantStore.note}</p>
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
						title={t('recipe.addAllMissingBtnTitle')}
					>
						{t('recipe.addAllMissingBtn', { count: allMissingIngredients.length })}
					</Button>
				</div>
			</div>
		{/if}

		<ul class="result-list" data-testid="recipe-result-list">
			{#each recipeAssistantStore.recipes as recipe (recipe.id)}
				<li class="result-item">
					<div class="result-copy">
						<p class="result-title">{recipe.title}</p>
						<p class="result-lead">{recipe.whyItFits}</p>
					</div>
					<Button
						type="button"
						variant="secondary"
						onclick={() => openRecipe(recipe)}
						data-testid="recipe-open-btn"
					>
						{t('recipe.detail.open')}
					</Button>
				</li>
			{/each}
		</ul>
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

	.intent-preset:has(input:focus-visible) {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.intent-preset input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}

	.advanced-disclosure {
		margin-bottom: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.advanced-disclosure summary {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		padding: var(--space-sm) var(--space-md);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		list-style: none;
	}

	.advanced-disclosure summary::-webkit-details-marker {
		display: none;
	}

	.advanced-disclosure summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--color-text-muted);
		transition: transform 0.15s;
	}

	.advanced-disclosure[open] summary::after {
		transform: rotate(180deg);
	}

	.advanced-disclosure summary:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.advanced-body {
		padding: 0 var(--space-md) var(--space-md);
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
		margin-bottom: 0;
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

	.result-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.result-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.result-copy {
		flex: 1;
		min-width: 0;
	}

	.result-title {
		margin: 0;
		font-weight: 700;
		font-size: 0.9375rem;
	}

	.result-lead {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
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

		.intent-presets {
			grid-template-columns: 1fr;
		}

		.intent-preset {
			flex-direction: row;
			justify-content: center;
			min-height: 2.75rem;
		}
	}

	.note {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
	}

	.extras-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin: var(--space-md) 0;
		padding: var(--space-sm) var(--space-md);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.extras-honesty {
		margin: 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.extras-stale-link {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		min-height: var(--touch-target-min);
		display: inline-flex;
		align-items: center;
	}

	.extras-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.extras-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.3rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		font: inherit;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		min-height: 2.25rem;
	}

	.extras-chip:focus-visible,
	.extras-add:focus-visible,
	.extras-input:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.extras-row {
		display: flex;
		gap: var(--space-sm);
	}

	.extras-input {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target-min);
		padding: 0.45rem 0.7rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font: inherit;
		font-size: 0.9375rem;
		background: var(--color-surface);
	}

	.extras-add {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		padding: 0 var(--space-md);
		font: inherit;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		cursor: pointer;
		min-height: var(--touch-target-min);
		flex-shrink: 0;
	}
</style>
