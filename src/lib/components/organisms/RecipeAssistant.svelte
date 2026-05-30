<script lang="ts">
	import { t } from '$lib/i18n';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { DEFAULT_RECIPE_PORTIONS } from '$lib/domain/recipe';

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
	let recipes = $state<RecipeSuggestion[]>([]);
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);
	let listFeedback = $state<string | null>(null);
	let addingMissingFor = $state<string | null>(null);

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
		listFeedback = null;

		try {
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					preferences,
					portions
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

	async function addMissingToList(recipe: RecipeSuggestion) {
		if (!canEdit || recipe.missingIngredients.length === 0) {
			return;
		}

		addingMissingFor = recipe.title;
		listFeedback = null;
		errorMessage = null;

		try {
			const response = await fetch('/api/recipes/add-missing', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ingredients: recipe.missingIngredients })
			});

			const data = (await response.json()) as {
				error?: string;
				added?: number;
				skipped?: number;
			};

			if (!response.ok) {
				listFeedback = data.error ?? t('recipe.addMissingFailed');
				return;
			}

			const added = data.added ?? 0;
			const skipped = data.skipped ?? 0;
			if (added === 0 && skipped > 0) {
				listFeedback = t('recipe.addMissingNone');
			} else if (skipped > 0) {
				listFeedback = t('recipe.addMissingPartial', { added, skipped });
			} else {
				listFeedback = t('recipe.addMissingSuccess', { count: added });
			}
		} catch {
			listFeedback = t('recipe.addMissingFailed');
		} finally {
			addingMissingFor = null;
		}
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

	{#if listFeedback}
		<FeedbackBanner tone="success" message={listFeedback} />
	{/if}

	{#if note}
		<p class="note">{note}</p>
	{/if}

	{#if recipes.length > 0}
		<div class="result-list">
			{#each recipes as recipe}
				<section class="recipe">
					<h3>{recipe.title}</h3>
					<p class="why">{recipe.whyItFits}</p>
					<p><strong>{t('recipe.fromStock')}</strong> {recipe.ingredientsToUse.join(', ')}</p>
					<p><strong>{t('planer.missingLabel')}</strong> {recipe.missingIngredients.join(', ') || t('common.none')}</p>
					{#if canEdit && recipe.missingIngredients.length > 0}
						<Button
							type="button"
							variant="secondary"
							loading={addingMissingFor === recipe.title}
							loadingLabel={t('common.loading')}
							onclick={() => addMissingToList(recipe)}
						>
							{t('recipe.addMissingBtn')}
						</Button>
					{/if}
					<ol>
						{#each recipe.steps as step}
							<li>{step}</li>
						{/each}
					</ol>
				</section>
			{/each}
		</div>
	{/if}
</Modal>

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

	h3 {
		margin: 0 0 var(--space-xs);
	}

	.why {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted);
	}

	ol {
		margin: var(--space-sm) 0 0;
		padding-left: 1.25rem;
	}
</style>
