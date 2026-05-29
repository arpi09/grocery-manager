<script lang="ts">
	import type { PlannedMeal } from '$lib/domain/meal-plan';
	import { mealSourceVariant, splitVisibleMeals } from '$lib/domain/calendar-display';

	interface DayData {
		date: string;
		dayOfMonth: number;
		isCurrentMonth: boolean;
		meals: PlannedMeal[];
	}

	interface Props {
		day: DayData;
		todayIso: string;
		visibleLimit: number;
		onOpen: (day: DayData) => void;
	}

	let { day, todayIso, visibleLimit, onOpen }: Props = $props();

	const { visible, hiddenCount } = $derived(splitVisibleMeals(day.meals, visibleLimit));
	const isToday = $derived(day.date === todayIso);
</script>

<div
	class="day"
	class:outside={!day.isCurrentMonth}
	class:today={isToday}
	role="group"
	aria-label="{day.dayOfMonth} {day.isCurrentMonth ? '' : '(annan månad)'}"
>
	<button type="button" class="day-head" onclick={() => onOpen(day)} aria-label="Öppna {day.date}">
		<span class="day-number" aria-hidden="true">{day.dayOfMonth}</span>
		{#if day.meals.length > 0}
			<span class="meal-count" aria-label="{day.meals.length} måltider">{day.meals.length}</span>
		{/if}
	</button>

	<div class="day-meals">
		{#each visible as meal (meal.id)}
			<button
				type="button"
				class="meal-chip"
				class:meal-chip-idea={mealSourceVariant(meal.ideaId) === 'idea'}
				onclick={() => onOpen(day)}
				title={meal.title}
			>
				<span class="meal-chip-text">{meal.title}</span>
			</button>
		{/each}
	</div>

	{#if hiddenCount > 0}
		<button type="button" class="show-all" onclick={() => onOpen(day)}>
			Visa alla ({day.meals.length})
		</button>
	{:else if day.meals.length === 0}
		<button type="button" class="add-hint" onclick={() => onOpen(day)} aria-label="Lägg till måltid">
			<span aria-hidden="true">+</span>
		</button>
	{/if}
</div>

<style>
	.day {
		min-width: 0;
		min-height: 5.5rem;
		padding: var(--space-xs);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	@media (min-width: 768px) {
		.day {
			min-height: 9.5rem;
			padding: var(--space-sm);
			gap: var(--space-xs);
		}
	}

	.day:hover {
		border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
	}

	.day.outside {
		background: var(--color-surface-muted);
		opacity: 0.72;
	}

	.day.today {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent);
	}

	.day-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xs);
		min-height: 2.75rem;
		padding: 0.15rem 0.25rem;
		border: none;
		background: transparent;
		cursor: pointer;
		border-radius: var(--radius-sm);
		color: inherit;
	}

	.day-head:hover {
		background: var(--color-surface-muted);
	}

	.day-number {
		font-weight: 700;
		font-size: 0.95rem;
		line-height: 1;
	}

	@media (min-width: 768px) {
		.day-number {
			font-size: 1.05rem;
		}
	}

	.meal-count {
		font-size: 0.68rem;
		font-weight: 700;
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
		border-radius: 999px;
		padding: 0.15rem 0.45rem;
		flex-shrink: 0;
	}

	.day-meals {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		min-width: 0;
		flex: 1;
	}

	.meal-chip {
		display: flex;
		align-items: center;
		min-height: 2.75rem;
		width: 100%;
		padding: 0.35rem 0.45rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
		color: var(--color-text);
		font-size: 0.72rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		min-width: 0;
	}

	@media (min-width: 768px) {
		.meal-chip {
			min-height: 2rem;
			font-size: 0.78rem;
		}
	}

	.meal-chip-idea {
		border-color: color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
		background: color-mix(in srgb, var(--color-accent) 12%, var(--color-surface-muted));
	}

	.meal-chip-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.show-all,
	.add-hint {
		min-height: 2.75rem;
		padding: 0.35rem 0.45rem;
		border: 1px dashed color-mix(in srgb, var(--color-primary) 35%, var(--color-border));
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-primary);
		font-size: 0.72rem;
		font-weight: 700;
		cursor: pointer;
		width: 100%;
	}

	.add-hint {
		display: grid;
		place-items: center;
		font-size: 1rem;
		opacity: 0.65;
	}

	.show-all:hover,
	.add-hint:hover,
	.meal-chip:hover {
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface-muted));
	}

	@media (prefers-reduced-motion: reduce) {
		.day {
			transition: none;
		}
	}
</style>
