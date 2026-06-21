<script lang="ts">
	import { t, getLocale } from '$lib/i18n';
	import Button from '$lib/components/atoms/Button.svelte';
	import AddMissingFeedback from '$lib/components/molecules/AddMissingFeedback.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import { trackAtaRecipeOpened } from '$lib/client/ata-telemetry';
	import { recipeDetailHref } from '$lib/utils/recipe-assistant-nav';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { formatCalendarDayLabel, mealSourceVariant } from '$lib/domain/calendar-display';
	import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';
	import {
		addMissingIngredientsToList,
		dedupeMissingIngredients,
		presentAddMissingFeedback,
		type AddMissingFeedbackTone
	} from '$lib/utils/recipe-add-missing';

	interface DayData {
		date: string;
		dayOfMonth: number;
		isCurrentMonth: boolean;
		meals: PlannedMeal[];
	}

	interface Props {
		open: boolean;
		day: DayData | null;
		month: string;
		ideasById?: Record<string, RecipeIdea>;
		canEdit?: boolean;
		onClose: () => void;
	}

	let { open, day, month, ideasById = {}, canEdit = false, onClose }: Props = $props();
	let expandedMealId = $state<string | null>(null);
	let addingMissingKey = $state<string | null>(null);
	let feedbackBanner = $state<{ message: string; tone: AddMissingFeedbackTone } | null>(null);

	$effect(() => {
		if (!open) {
			expandedMealId = null;
		}
	});

	function toggleMeal(mealId: string) {
		expandedMealId = expandedMealId === mealId ? null : mealId;
	}

	const sheetLabel = $derived(
		day ? t('planer.mealsTitleDate', { date: formatCalendarDayLabel(day.date) }) : t('planer.mealsTitle')
	);

	const dayMissingIngredients = $derived(
		day
			? dedupeMissingIngredients(
					day.meals
						.map((meal) => linkedIdea(meal)?.missingIngredients ?? [])
						.filter((list) => list.length > 0)
				)
			: []
	);

	function linkedIdea(meal: PlannedMeal): RecipeIdea | null {
		if (!meal.ideaId) {
			return null;
		}
		return ideasById[meal.ideaId] ?? null;
	}

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

	async function addAllMissingForDay() {
		if (!canEdit || dayMissingIngredients.length === 0) {
			return;
		}

		addingMissingKey = '__all__';
		feedbackBanner = null;
		showAddMissingResult(await addMissingIngredientsToList(dayMissingIngredients));
		addingMissingKey = null;
	}

	async function addMissingFromMeal(meal: PlannedMeal, event?: MouseEvent) {
		event?.preventDefault();
		event?.stopPropagation();
		const idea = linkedIdea(meal);
		if (!canEdit || !idea || idea.missingIngredients.length === 0) {
			return;
		}

		addingMissingKey = meal.id;
		feedbackBanner = null;
		showAddMissingResult(await addMissingIngredientsToList(idea.missingIngredients));
		addingMissingKey = null;
	}

</script>

{#if day}
	<Modal {open} onClose={onClose} variant="sheet" label={sheetLabel} panelClass="calendar-day-panel">
		{#snippet header()}
			<ModalHeader
				title={formatCalendarDayLabel(day.date)}
				subtitle={t('planer.plannedCount', { count: day.meals.length })}
				onClose={onClose}
			/>
		{/snippet}

		<section class="add-section" aria-label={t('planer.addMeal')}>
			<h3>{t('planer.addMeal')}</h3>
			<form method="POST" action="?/create" class="create-form">
				<input type="hidden" name="month" value={month} />
				<input type="hidden" name="plannedDate" value={day.date} />
				<input type="hidden" name="notes" value="" />
				<label class="sr-only" for="new-meal-title">{t('planer.mealsTitle')}</label>
				<input
					id="new-meal-title"
					type="text"
					name="title"
					placeholder={t('planer.mealTitle')}
					required
				/>
				<Button type="submit" fullWidth>{t('shopping.addLabel')}</Button>
			</form>
		</section>

		{#if day.meals.length === 0}
			<p class="empty">{t('planer.emptyDay')}</p>
		{:else}
			{#if feedbackBanner}
				<AddMissingFeedback feedback={feedbackBanner} />
			{/if}
			{#if canEdit && dayMissingIngredients.length > 0}
				<div class="day-batch-action">
					<Button
						type="button"
						fullWidth
						loading={addingMissingKey === '__all__'}
						loadingLabel={t('common.loading')}
						onclick={addAllMissingForDay}
					>
						{t('recipe.addAllMissingBtn', { count: dayMissingIngredients.length })}
					</Button>
				</div>
			{/if}
			<ul class="meal-list">
				{#each day.meals as meal (meal.id)}
					{@const idea = linkedIdea(meal)}
					<li class="meal-card" class:expanded={expandedMealId === meal.id}>
						<div class="meal-summary-row">
							<div class="meal-heading">
								<span
									class="source-dot"
									class:source-dot-idea={mealSourceVariant(meal.ideaId) === 'idea'}
									aria-hidden="true"
								></span>
								<span class="meal-title">{meal.title}</span>
							</div>
							<div class="meal-actions">
								{#if idea}
									<a
										href={recipeDetailHref(idea.id, 'planer')}
										class="recipe-link"
										onclick={() => trackAtaRecipeOpened('day_sheet', idea.id)}
									>
										{t('planer.viewRecipe')}
									</a>
								{/if}
								{#if canEdit && idea && idea.missingIngredients.length > 0}
									<Button
										type="button"
										variant="secondary"
										class="summary-add-btn"
										loading={addingMissingKey === meal.id}
										loadingLabel={t('common.loading')}
										onclick={(event) => addMissingFromMeal(meal, event)}
									>
										{t('recipe.addMissingBtnShort', { count: idea.missingIngredients.length })}
									</Button>
								{/if}
								<button
									type="button"
									class="expand-btn"
									aria-expanded={expandedMealId === meal.id}
									aria-label={expandedMealId === meal.id ? t('common.close') : t('common.more')}
									onclick={() => toggleMeal(meal.id)}
								>
									<span aria-hidden="true">{expandedMealId === meal.id ? '−' : '+'}</span>
								</button>
							</div>
						</div>

						{#if expandedMealId === meal.id}
							<div class="meal-detail">
								<form method="POST" action="?/update" class="edit-form">
									<input type="hidden" name="month" value={month} />
									<input type="hidden" name="id" value={meal.id} />
									<label>
										{t('common.titleField')}
										<input name="title" value={meal.title} required />
									</label>
									<label>
										{t('common.date')}
										<input type="date" name="plannedDate" value={meal.plannedDate} required />
									</label>
									<label>
										{t('common.notes')}
										<textarea name="notes" rows="2">{meal.notes ?? ''}</textarea>
									</label>
									<Button type="submit" fullWidth>{t('common.save')}</Button>
								</form>
								<DeleteConfirmButton
									tier={2}
									context="plannedMeal"
									copyOptions={{ itemName: meal.title }}
									action="?/delete"
									fullWidth
									label={t('common.delete')}
									ariaLabel={t('planer.removeMeal', { title: meal.title })}
									class="delete-form"
								>
									<input type="hidden" name="month" value={month} />
									<input type="hidden" name="id" value={meal.id} />
									<input type="hidden" name="title" value={meal.title} />
								</DeleteConfirmButton>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</Modal>
{/if}


<style>
	:global(.calendar-day-panel) {
		width: min(520px, calc(100vw - 2rem));
	}

	h3 {
		margin: 0 0 var(--space-sm);
		font-size: 0.9rem;
	}

	.day-batch-action {
		margin-bottom: var(--space-md);
	}

	.add-section {
		padding: var(--space-md);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		margin-bottom: var(--space-md);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.create-form input,
	.edit-form input,
	.edit-form textarea {
		width: 100%;
		min-width: 0;
		padding: 0.65rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.empty {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
		text-align: center;
		padding: var(--space-md);
	}

	.meal-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.meal-card {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		overflow: hidden;
	}

	.meal-summary-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
	}

	.meal-heading {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		min-width: 0;
		min-height: 2.75rem;
	}

	.meal-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.meal-summary-row :global(.recipe-btn),
	.recipe-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: 0.78rem;
		padding: 0.35rem 0.55rem;
		min-height: 2rem;
		border-radius: var(--radius-sm);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-weight: 700;
		text-decoration: none;
	}
	.meal-summary-row :global(.summary-add-btn) {
		flex-shrink: 0;
		font-size: 0.75rem;
		padding: 0.35rem 0.5rem;
		min-height: 2rem;
	}

	.expand-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		min-height: 2rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text-muted);
		cursor: pointer;
		font-size: 1.1rem;
		line-height: 1;
	}

	.source-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: var(--color-primary);
		flex-shrink: 0;
	}

	.source-dot-idea {
		background: var(--color-accent);
	}

	.meal-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 600;
	}

	.meal-detail {
		padding: 0 var(--space-md) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		border-top: 1px solid var(--color-border);
	}

	.edit-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding-top: var(--space-sm);
	}

	.edit-form label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	:global(.delete-form) {
		margin: 0;
		width: 100%;
	}
</style>
