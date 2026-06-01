<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { fetchMealPlanIdeas } from '$lib/client/planer-data';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { canEditInventory } from '$lib/domain/household';
	import { getLocale, t } from '$lib/i18n';
	import {
		addMissingIngredientsToList,
		formatAddMissingFeedback
	} from '$lib/utils/recipe-add-missing';

	interface Props {
		month: string;
		onIdeasChange?: (ideas: RecipeIdea[]) => void;
	}

	let { month, onIdeasChange }: Props = $props();

	const canEdit = $derived(
		page.data.householdRole ? canEditInventory(page.data.householdRole) : false
	);

	let ideas = $state<RecipeIdea[]>([]);
	let loading = $state(true);
	let loadError = $state(false);
	let addingMissingKey = $state<string | null>(null);
	let toastMessage = $state<string | null>(null);

	onMount(async () => {
		try {
			ideas = await fetchMealPlanIdeas();
			onIdeasChange?.(ideas);
		} catch {
			loadError = true;
		} finally {
			loading = false;
		}
	});

	async function addMissingFromIdea(idea: RecipeIdea) {
		if (!canEdit || idea.missingIngredients.length === 0) {
			return;
		}

		addingMissingKey = idea.id;
		const result = await addMissingIngredientsToList(idea.missingIngredients);
		toastMessage = formatAddMissingFeedback(getLocale(), result);
		addingMissingKey = null;
	}

	function dismissToast() {
		toastMessage = null;
	}
</script>

<aside class="ideas-card" aria-label={t('planer.ideasAria')}>
	<h3>{t('planer.ideasTitle')}</h3>
	<p class="ideas-sub">
		{t('planer.ideasIntro')}
	</p>

	{#if loading}
		<p class="empty">{t('common.loading')}</p>
	{:else if loadError}
		<p class="empty">{t('common.errorGeneric')}</p>
	{:else if ideas.length === 0}
		<p class="empty">{t('planer.ideasEmpty')}</p>
	{:else}
		<div class="idea-list">
			{#each ideas as idea (idea.id)}
				<details class="idea-item">
					<summary>{idea.title}</summary>
					<p>{idea.whyItFits}</p>
					<p><strong>{t('planer.usesLabel')}</strong> {idea.ingredientsToUse.join(', ')}</p>
					<div class="missing-row">
						<p class="missing-text">
							<strong>{t('planer.missingLabel')}</strong>
							{idea.missingIngredients.join(', ') || t('common.none')}
						</p>
						{#if canEdit && idea.missingIngredients.length > 0}
							<Button
								type="button"
								variant="secondary"
								loading={addingMissingKey === idea.id}
								loadingLabel={t('common.loading')}
								onclick={() => addMissingFromIdea(idea)}
							>
								{t('recipe.addMissingBtnCount', { count: idea.missingIngredients.length })}
							</Button>
						{/if}
					</div>
					<ol>
						{#each idea.steps as step}
							<li>{step}</li>
						{/each}
					</ol>
					<form method="POST" action="?/scheduleIdea" class="schedule-form">
						<input type="hidden" name="month" value={month} />
						<input type="hidden" name="ideaId" value={idea.id} />
						<label>
							{t('planer.scheduleDate')}
							<input type="date" name="plannedDate" required />
						</label>
						<button type="submit">{t('planer.addToCalendar')}</button>
					</form>
				</details>
			{/each}
		</div>
	{/if}
</aside>

{#if toastMessage}
	<Toast message={toastMessage} visible={true} onDismiss={dismissToast} />
{/if}

<style>
	h3 {
		margin: 0;
	}

	.ideas-card {
		min-width: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		box-shadow: var(--shadow-sm);
	}

	.ideas-sub {
		margin: 0.45rem 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.85rem;
		line-height: 1.45;
	}

	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.idea-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.idea-item {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-sm);
		background: var(--color-surface-muted);
	}

	.idea-item summary {
		cursor: pointer;
		font-weight: 700;
		font-size: 0.92rem;
		min-height: 2.75rem;
		display: flex;
		align-items: center;
	}

	.idea-item p {
		margin: var(--space-xs) 0;
		font-size: 0.85rem;
	}

	.missing-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin: var(--space-xs) 0;
	}

	.missing-text {
		margin: 0;
		font-size: 0.85rem;
	}

	.idea-item ol {
		margin: var(--space-sm) 0;
		padding-left: 1.1rem;
		font-size: 0.84rem;
	}

	.schedule-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px dashed var(--color-border);
	}

	.schedule-form label {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.schedule-form input {
		min-width: 0;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.schedule-form button {
		min-height: 2.75rem;
		border: none;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: #fff;
		font-weight: 700;
		padding: 0.55rem 0.75rem;
		cursor: pointer;
	}
</style>
