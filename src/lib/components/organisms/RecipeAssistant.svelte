<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';

	interface RecipeSuggestion {
		title: string;
		whyItFits: string;
		ingredientsToUse: string[];
		missingIngredients: string[];
		steps: string[];
	}

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();
	let loading = $state(false);
	let preferences = $state('');
	let recipes = $state<RecipeSuggestion[]>([]);
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);

	function recipeErrorMessage(status: number, serverError?: string): string {
		if (serverError?.trim()) {
			return serverError;
		}
		if (status === 401) {
			return 'Du måste vara inloggad för att generera recept.';
		}
		if (status === 422) {
			return 'Kunde inte tolka receptförslagen. Försök igen om en stund.';
		}
		if (status === 503) {
			return 'AI-tjänsten är tillfälligt otillgänglig. Försök igen om en stund.';
		}
		if (status === 502) {
			return 'Kunde inte nå AI-tjänsten just nu. Försök igen om en stund.';
		}
		return 'Kunde inte generera recept just nu.';
	}

	async function generateRecipes() {
		loading = true;
		errorMessage = null;
		note = null;

		try {
			const response = await fetch('/api/recipes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					preferences
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
				errorMessage = 'Inga recept genererades. Lägg till fler varor och försök igen.';
			}
		} catch {
			errorMessage = 'Nätverksfel vid generering av recept. Kontrollera anslutningen och försök igen.';
			recipes = [];
		} finally {
			loading = false;
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
	title="Receptförslag"
	panelClass="recipe-assistant-panel"
>
	<p class="helper">
		Få matidéer utifrån ditt nuvarande lager. Lägg till önskemål som "snabb middag" eller
		"vegetariskt".
	</p>

	<label class="label" for="recipe-preferences">Önskemål (valfritt)</label>
	<textarea
		id="recipe-preferences"
		class="textarea"
		rows="3"
		maxlength="300"
		bind:value={preferences}
		placeholder="Exempel: under 30 minuter, utan mejeri"
	></textarea>

	<div class="actions">
		<Button type="button" onclick={generateRecipes} disabled={loading} fullWidth>
			{loading ? 'Genererar...' : 'Generera recept'}
		</Button>
	</div>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
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
					<p><strong>Från lagret:</strong> {recipe.ingredientsToUse.join(', ')}</p>
					<p><strong>Saknas:</strong> {recipe.missingIngredients.join(', ') || 'Inget'}</p>
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

	.helper {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
	}

	.label {
		display: block;
		margin-bottom: var(--space-xs);
		font-weight: 600;
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

	.error {
		color: var(--color-danger);
		margin: 0 0 var(--space-md);
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
