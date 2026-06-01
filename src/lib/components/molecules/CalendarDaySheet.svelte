<script lang="ts">
	import { t, getLocale } from '$lib/i18n';
	import Button from '$lib/components/atoms/Button.svelte';
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ModalHeader from '$lib/components/molecules/ModalHeader.svelte';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { formatCalendarDayLabel, mealSourceVariant } from '$lib/domain/calendar-display';
	import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';
	import {
		addMissingIngredientsToList,
		dedupeMissingIngredients,
		formatAddMissingFeedback
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
	let toastMessage = $state<string | null>(null);

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

	async function addAllMissingForDay() {
		if (!canEdit || dayMissingIngredients.length === 0) {
			return;
		}

		addingMissingKey = '__all__';
		const result = await addMissingIngredientsToList(dayMissingIngredients);
		toastMessage = formatAddMissingFeedback(getLocale(), result);
		addingMissingKey = null;
	}

	async function addMissingFromMeal(meal: PlannedMeal) {
		const idea = linkedIdea(meal);
		if (!canEdit || !idea || idea.missingIngredients.length === 0) {
			return;
		}

		addingMissingKey = meal.id;
		const result = await addMissingIngredientsToList(idea.missingIngredients);
		toastMessage = formatAddMissingFeedback(getLocale(), result);
		addingMissingKey = null;
	}

	function dismissToast() {
		toastMessage = null;
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
					<li class="meal-card" class:expanded={expandedMealId === meal.id}>
						<button
							type="button"
							class="meal-summary"
							aria-expanded={expandedMealId === meal.id}
							onclick={() => toggleMeal(meal.id)}
						>
							<span
								class="source-dot"
								class:source-dot-idea={mealSourceVariant(meal.ideaId) === 'idea'}
								aria-hidden="true"
							></span>
							<span class="meal-title">{meal.title}</span>
							<span class="chevron" aria-hidden="true">{expandedMealId === meal.id ? '−' : '+'}</span>
						</button>

						{#if expandedMealId === meal.id}
							<div class="meal-detail">
								{#if linkedIdea(meal)}
									{@const idea = linkedIdea(meal)!}
									<div class="idea-ingredients">
										<p>
											<strong>{t('planer.usesLabel')}</strong>
											{idea.ingredientsToUse.join(', ')}
										</p>
										<div class="missing-row">
											<p class="missing-text">
												<strong>{t('planer.missingLabel')}</strong>
												{idea.missingIngredients.join(', ') || t('common.none')}
											</p>
											{#if canEdit && idea.missingIngredients.length > 0}
												<Button
													type="button"
													variant="secondary"
													loading={addingMissingKey === meal.id}
													loadingLabel={t('common.loading')}
													onclick={() => addMissingFromMeal(meal)}
													fullWidth
												>
													{t('recipe.addMissingBtnCount', {
														count: idea.missingIngredients.length
													})}
												</Button>
											{/if}
										</div>
									</div>
								{/if}
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
								</DeleteConfirmButton>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</Modal>
{/if}

{#if toastMessage}
	<Toast message={toastMessage} visible={true} onDismiss={dismissToast} />
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

	.meal-summary {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		width: 100%;
		min-height: 2.75rem;
		padding: var(--space-sm) var(--space-md);
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font-weight: 600;
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
	}

	.chevron {
		color: var(--color-text-muted);
		font-size: 1.1rem;
		line-height: 1;
	}

	.meal-detail {
		padding: 0 var(--space-md) var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		border-top: 1px solid var(--color-border);
	}

	.idea-ingredients {
		padding-top: var(--space-sm);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.idea-ingredients p {
		margin: 0;
		font-size: 0.84rem;
	}

	.missing-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.missing-text {
		margin: 0;
		font-size: 0.84rem;
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
