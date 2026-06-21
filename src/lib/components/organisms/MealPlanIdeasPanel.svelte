<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import { trackAtaRecipeOpened } from '$lib/client/ata-telemetry';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { fetchMealPlanIdeas, dismissMealPlanIdea } from '$lib/client/planer-data';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { normalizeRecipeIdeas, type RecipeIdeaLoad } from '$lib/utils/meal-plan-ideas';
	import { canEditInventory } from '$lib/domain/household';
	import { OPEN_RECIPE_IDEAS } from '$lib/navigation/app-layout-context';
	import { getLocale, t } from '$lib/i18n';
	import { recipeDetailHref } from '$lib/utils/recipe-assistant-nav';
	import {
		addMissingIngredientsToList,
		dedupeMissingIngredients,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';


	interface Props {

		month: string;

		initialIdeas?: RecipeIdeaLoad[];

		onIdeasChange?: (ideas: RecipeIdea[]) => void;

	}



	let { month, initialIdeas = [], onIdeasChange }: Props = $props();

	const openRecipeIdeas = getContext<(() => void) | undefined>(OPEN_RECIPE_IDEAS);


	const canEdit = $derived(

		page.data.householdRole ? canEditInventory(page.data.householdRole) : false

	);



	let ideas = $state<RecipeIdea[]>(normalizeRecipeIdeas(initialIdeas));

	let loading = $state(initialIdeas.length === 0);

	let loadError = $state(false);

	let addingMissingKey = $state<string | null>(null);

	let dismissingKey = $state<string | null>(null);

	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);



	const allMissingIngredients = $derived(

		dedupeMissingIngredients(ideas.map((idea) => idea.missingIngredients))

	);



	onMount(async () => {

		if (initialIdeas.length > 0) {

			onIdeasChange?.(ideas);

			return;

		}



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
		const variant =
			presented.tone === 'error' ? 'error' : presented.tone === 'warning' ? 'info' : 'success';
		const toastMessage = presented.showListLink
			? `${presented.message} ${t('weeklyRitual.linkInkop')}`
			: presented.message;
		showClientToast(toastMessage, { variant });
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



	async function dismissIdea(idea: RecipeIdea, event?: MouseEvent) {

		event?.preventDefault();

		event?.stopPropagation();

		if (!canEdit) {

			return;

		}



		dismissingKey = idea.id;

		try {

			await dismissMealPlanIdea(idea.id);

			ideas = ideas.filter((item) => item.id !== idea.id);

			onIdeasChange?.(ideas);

		} catch {

			showClientToast(t('planer.dismissFailed'), { variant: 'error' });

		} finally {

			dismissingKey = null;

		}

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
		<div class="empty-actions">
			{#if openRecipeIdeas}
				<Button type="button" onclick={openRecipeIdeas}>{t('planer.ideasEmptyCtaIdeas')}</Button>
			{/if}
			<a class="weekly-empty-link" href="/planer/vecka">{t('planer.ideasEmptyCtaWeekly')}</a>
		</div>	{:else}

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
					title={t('recipe.addAllMissingBtnTitle')}
					onclick={addAllMissing}
				>
					{t('recipe.addAllMissingBtn', { count: allMissingIngredients.length })}
				</Button>
			</div>

		{/if}

		<div class="idea-list">

			{#each ideas as idea (idea.id)}

				<article class="idea-item">
					<a
						href={recipeDetailHref(idea.id, 'planer')}
						class="idea-link"
						onclick={() => trackAtaRecipeOpened('ideas', idea.id)}
					>
						<span class="idea-title">{idea.title}</span>
						<span class="idea-meta">{idea.whyItFits}</span>
					</a>

					<div class="idea-actions">
						<a
							href="/recept/{idea.id}/laga"
							class="cook-link"
							onclick={() => trackAtaRecipeOpened('ideas', idea.id)}
						>
							{t('planer.cookRecipe')}
						</a>
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
						{#if canEdit}
							<Button
								type="button"
								variant="ghost"
								class="dismiss-btn"
								loading={dismissingKey === idea.id}
								loadingLabel={t('common.loading')}
								onclick={(event) => dismissIdea(idea, event)}
							>
								{t('planer.dismissNotInterested')}
							</Button>
						{/if}
					</div>

					<form method="POST" action="?/scheduleIdea" class="schedule-form">

						<input type="hidden" name="month" value={month} />

						<input type="hidden" name="ideaId" value={idea.id} />

						<input type="hidden" name="title" value={idea.title} />

						<label>

							{t('planer.scheduleDate')}

							<input type="date" name="plannedDate" required />

						</label>

						<button type="submit">{t('planer.addToCalendar')}</button>

					</form>

				</article>

			{/each}

		</div>

	{/if}

</aside>





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

	.empty-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		align-items: center;
	}

	.weekly-empty-link {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
	}

	.weekly-empty-link:hover {
		text-decoration: underline;
	}

	.cook-link {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2rem;
		padding: 0.35rem 0.55rem;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: 0.78rem;
		font-weight: 700;
		text-decoration: none;
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



	.idea-link {
		display: block;
		min-width: 0;
		padding-bottom: var(--space-xs);
		text-decoration: none;
		color: inherit;
	}



	.idea-link:hover .idea-title {

		color: var(--color-primary);

	}



	.idea-title {
		display: block;
		font-weight: 700;
		font-size: 0.92rem;
		line-height: 1.35;
		word-break: break-word;
	}

	.idea-meta {
		display: block;
		margin-top: 0.15rem;
		font-size: 0.78rem;
		color: var(--color-text-muted);
		line-height: 1.35;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.idea-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-xs);
	}

	.idea-actions :global(.summary-add-btn) {
		flex-shrink: 0;
		font-size: 0.78rem;
		padding: 0.35rem 0.55rem;
		min-height: 2rem;
	}

	.idea-actions :global(.dismiss-btn) {
		flex-shrink: 0;
		font-size: 0.75rem;
		padding: 0.35rem 0.55rem;
		min-height: 2rem;
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


