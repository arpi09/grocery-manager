<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';

	interface RecipeSuggestion {
		title: string;
		whyItFits: string;
		ingredientsToUse: string[];
		missingIngredients: string[];
		steps: string[];
	}

	let open = $state(false);
	let loading = $state(false);
	let preferences = $state('');
	let recipes = $state<RecipeSuggestion[]>([]);
	let errorMessage = $state<string | null>(null);
	let note = $state<string | null>(null);

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
				errorMessage = data.error ?? 'Failed to generate recipes.';
				recipes = [];
				return;
			}

			recipes = data.recipes ?? [];
			note = data.note ?? null;
		} catch {
			errorMessage = 'Network error while generating recipes.';
			recipes = [];
		} finally {
			loading = false;
		}
	}

	function openAssistant() {
		open = true;
	}

	function closeAssistant() {
		open = false;
	}
</script>

<button type="button" class="fab" onclick={openAssistant} aria-label="Get recipe suggestions">
	Recipe ideas
</button>

{#if open}
	<div class="overlay" role="dialog" aria-modal="true" aria-label="Recipe suggestions">
		<div class="modal">
			<div class="head">
				<h2>Recipe suggestions</h2>
				<button class="close" type="button" onclick={closeAssistant} aria-label="Close recipe assistant">
					X
				</button>
			</div>

			<p class="helper">
				Generate meal ideas from your current inventory. Add preferences like "quick dinner" or
				"vegetarian".
			</p>

			<label class="label" for="recipe-preferences">Preferences (optional)</label>
			<textarea
				id="recipe-preferences"
				class="textarea"
				rows="3"
				maxlength="300"
				bind:value={preferences}
				placeholder="Example: under 30 minutes, no dairy"
			></textarea>

			<div class="actions">
				<Button type="button" onclick={generateRecipes} disabled={loading} fullWidth>
					{loading ? 'Generating...' : 'Generate recipes'}
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
							<p><strong>Use from inventory:</strong> {recipe.ingredientsToUse.join(', ')}</p>
							<p><strong>Missing:</strong> {recipe.missingIngredients.join(', ') || 'None'}</p>
							<ol>
								{#each recipe.steps as step}
									<li>{step}</li>
								{/each}
							</ol>
						</section>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.fab {
		position: fixed;
		left: 50%;
		bottom: 1.1rem;
		transform: translateX(-50%);
		z-index: 25;
		border: none;
		border-radius: 999px;
		padding: 0.75rem 1.25rem;
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		cursor: pointer;
		box-shadow: var(--shadow-md);
	}

	.fab:hover {
		background: var(--color-primary-hover);
	}

	.overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgba(20, 30, 26, 0.4);
		display: grid;
		place-items: center;
		padding: var(--space-md);
	}

	.modal {
		width: min(760px, 100%);
		max-height: 85vh;
		overflow: auto;
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--color-border);
		padding: var(--space-lg);
		box-shadow: var(--shadow-md);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-sm);
	}

	h2 {
		margin: 0;
	}

	.close {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		cursor: pointer;
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

	@media (max-width: 768px) {
		.fab {
			bottom: 0.8rem;
			padding: 0.65rem 1rem;
		}
	}
</style>
