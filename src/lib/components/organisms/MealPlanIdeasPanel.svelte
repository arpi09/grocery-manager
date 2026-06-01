<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { fetchMealPlanIdeas } from '$lib/client/planer-data';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { canEditInventory } from '$lib/domain/household';
	import { getLocale, t } from '$lib/i18n';
	import {
		addMissingIngredientsToList,
		dedupeMissingIngredients,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
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
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);

	const allMissingIngredients = $derived(
		dedupeMissingIngredients(ideas.map((idea) => idea.missingIngredients))
	);

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

	function showAddMissingResult(result: Awaited<ReturnType<typeof addMissingIngredientsToList>>) {
		const presented = presentAddMissingFeedback(getLocale(), result);
		toastMessage = presented.message;
		feedbackBanner = presented;
	}

	async function addAllMissing() {
		if (!canEdit || allMissingIngredients.length === 0) {
			return;
		}

		addingMissingKey = '__all__';
		feedbackBanner = null;
		showAddMissingResult(await addMissingIngredientsToList(allMissingIngredients));
		addingMissingKey = null;
	}

	async function addMissingFromIdea(idea: RecipeIdea, event?: MouseEvent) {
		event?.preventDefault();
		event?.stopPropagation();
		if (!canEdit || idea.missingIngredients.length === 0) {
			return;
		}

		addingMissingKey = idea.id;
		feedbackBanner = null;
		showAddMissingResult(await addMissingIngredientsToList(idea.missingIngredients));
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
		{#if feedbackBanner}
			<AddMissingFeedback feedback={feedbackBanner} />
		{/if}
		{#if canEdit && allMissingIngredients.length > 0}
			<div class="batch-action">
				<Button
					type="button"
					fullWidth
					loading={addingMissingKey === '__all__'}
					loadingLabel={t('common.loading')}
					onclick={addAllMissing}
				>
					{t('recipe.addAllMissingBtn', { count: allMissingIngredients.length })}
				</Button>
			</div>
		{/if}
		<div class="idea-list">
			{#each ideas as idea (idea.id)}
				<details class="idea-item">
					<summary class="idea-summary">
						<span class="idea-title">{idea.title}</span>
						{#if canEdit && idea.missingIngredients.length > 0}
							<Button
								type="button"
								variant="secondary"
								class="summary-add-btn"
								loading={addingMissingKey === idea.id}
								loadingLabel={t('common.loading')}
								onclick={(event) => addMissingFromIdea(idea, event)}
							>
								{t('recipe.addMissingBtnShort', { count: idea.missingIngredients.length })}
							</Button>
						{/if}
					</summary>
					<p>{idea.whyItFits}</p>
					<p><strong>{t('planer.usesLabel')}</strong> {idea.ingredientsToUse.join(', ')}</p>
					<p class="missing-text">
						<strong>{t('planer.missingLabel')}</strong>
						{idea.missingIngredients.join(', ') || t('common.none')}
					</p>
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

	.batch-action {
		margin-bottom: var(--space-md);
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

	.idea-summary {
		cursor: pointer;
		font-weight: 700;
		font-size: 0.92rem;
		min-height: 2.75rem;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		list-style: none;
	}

	.idea-title {
		flex: 1;
		min-width: 0;
	}

	.idea-summary :global(.summary-add-btn) {
		flex-shrink: 0;
		font-size: 0.78rem;
		padding: 0.35rem 0.55rem;
		min-height: 2rem;
	}

	.idea-item p {
		margin: var(--space-xs) 0;
		font-size: 0.85rem;
	}

	.missing-text {
		margin: var(--space-xs) 0;
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
