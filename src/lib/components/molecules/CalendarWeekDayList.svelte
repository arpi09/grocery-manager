<script lang="ts">
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { trackAtaRecipeOpened } from '$lib/client/ata-telemetry';
	import { recipeDetailHref } from '$lib/utils/recipe-assistant-nav';
	import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';
	import {
		formatCalendarDayLabel,
		mealSourceVariant,
		splitVisibleMeals
	} from '$lib/domain/calendar-display';

	interface DayData {
		date: string;
		dayOfMonth: number;
		isCurrentMonth: boolean;
		meals: PlannedMeal[];
	}

	interface Props {
		week: DayData[];
		todayIso: string;
		visibleLimit: number;
		ideasById?: Record<string, RecipeIdea>;
		onOpen: (day: DayData) => void;
	}

	let { week, todayIso, visibleLimit, ideasById = {}, onOpen }: Props = $props();

	function mealHasRecipe(meal: PlannedMeal): boolean {
		return Boolean(meal.ideaId && ideasById[meal.ideaId]);
	}

	function openRecipe(meal: PlannedMeal, day: DayData, event: MouseEvent) {
		event.stopPropagation();
		if (!meal.ideaId) {
			onOpen(day);
			return;
		}
		trackAtaRecipeOpened('calendar', meal.ideaId);
		void goto(recipeDetailHref(meal.ideaId, 'planer'));
	}

	function mealSourceLabel(meal: PlannedMeal): string {
		return mealSourceVariant(meal.ideaId) === 'idea'
			? t('planer.mealSourceIdea')
			: t('planer.mealSourceManual');
	}
</script>

<div class="week-day-list" role="list" aria-label={t('planer.weekCalendarAria')}>
	{#each week as day (day.date)}
		{@const { visible, hiddenCount } = splitVisibleMeals(day.meals, visibleLimit)}
		{@const isToday = day.date === todayIso}
		<article
			class="week-day-row"
			class:outside={!day.isCurrentMonth}
			class:today={isToday}
			role="listitem"
		>
			<button
				type="button"
				class="week-day-head"
				onclick={() => onOpen(day)}
				aria-label={t('planer.openDay', { date: formatCalendarDayLabel(day.date) })}
			>
				<span class="week-day-label">{formatCalendarDayLabel(day.date)}</span>
				{#if day.meals.length > 0}
					<span class="meal-count" aria-label={t('planer.mealsCount', { count: day.meals.length })}>
						{day.meals.length}
					</span>
				{/if}
			</button>

			<div class="week-day-meals">
				{#each visible as meal (meal.id)}
					<button
						type="button"
						class="meal-chip"
						class:meal-chip-idea={mealSourceVariant(meal.ideaId) === 'idea'}
						class:meal-chip-recipe={mealHasRecipe(meal)}
						onclick={(event) => openRecipe(meal, day, event)}
						title={meal.title}
					>
						<span class="meal-source-label">{mealSourceLabel(meal)}</span>
						<span class="meal-chip-text">{meal.title}</span>
						{#if mealHasRecipe(meal)}
							<span class="meal-chip-action" aria-hidden="true">→</span>
						{/if}
					</button>
				{/each}
			</div>

			{#if hiddenCount > 0}
				<button type="button" class="show-all" onclick={() => onOpen(day)}>
					{t('planer.showAllMeals', { count: day.meals.length })}
				</button>
			{:else if day.meals.length === 0}
				<button type="button" class="add-hint" onclick={() => onOpen(day)} aria-label={t('planer.addMeal')}>
					<span aria-hidden="true">+</span>
				</button>
			{/if}
		</article>
	{/each}
</div>

<style>
	.week-day-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.week-day-row {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		min-height: 6rem;
		padding: var(--space-sm);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.week-day-row.outside {
		background: var(--color-surface-muted);
		opacity: 0.82;
	}

	.week-day-row.today {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent);
	}

	.week-day-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-height: var(--touch-target-min);
		padding: 0.25rem 0.35rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: var(--radius-sm);
		color: inherit;
		text-align: left;
	}

	.week-day-head:hover {
		background: var(--color-surface-muted);
	}

	.week-day-head:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	.week-day-label {
		font-weight: 700;
		font-size: 0.95rem;
		line-height: 1.25;
		text-transform: capitalize;
	}

	.meal-count {
		flex-shrink: 0;
		font-size: 0.72rem;
		font-weight: 700;
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		border-radius: 999px;
		padding: 0.2rem 0.5rem;
	}

	.week-day-meals {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		flex: 1;
		min-height: 0;
	}

	.meal-chip {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-height: var(--touch-target-min);
		width: 100%;
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text);
		font-size: 0.85rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		min-width: 0;
	}

	.meal-chip:focus-visible,
	.show-all:focus-visible,
	.add-hint:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	.meal-chip-idea {
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
		background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-muted));
	}

	.meal-chip-recipe {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
	}

	.meal-source-label {
		flex-shrink: 0;
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
	}

	.meal-chip-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
		flex: 1;
	}

	.meal-chip-action {
		flex-shrink: 0;
		color: var(--color-primary);
		font-weight: 700;
	}

	.show-all,
	.add-hint {
		margin-top: auto;
		min-height: var(--touch-target-min);
		padding: 0.45rem 0.55rem;
		border: 1px dashed color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-primary);
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		width: 100%;
	}

	.add-hint {
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		opacity: 0.65;
	}

	.show-all:hover,
	.add-hint:hover,
	.meal-chip:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));
	}
</style>
