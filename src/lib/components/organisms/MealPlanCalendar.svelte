<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n';
	import { trackAtaWeekViewToggled } from '$lib/client/ata-telemetry';
	import CalendarDayCell from '$lib/components/molecules/CalendarDayCell.svelte';
	import CalendarDaySheet from '$lib/components/molecules/CalendarDaySheet.svelte';
	import {
		CALENDAR_VISIBLE_MEALS,
		CALENDAR_WEEKDAY_LABELS,
		findWeekForDate,
		type CalendarViewMode
	} from '$lib/domain/calendar-display';
	import type { PlannedMeal, RecipeIdea } from '$lib/domain/meal-plan';

	interface DayData {
		date: string;
		dayOfMonth: number;
		isCurrentMonth: boolean;
		meals: PlannedMeal[];
	}

	interface Props {
		weeks: DayData[][];
		month: string;
		monthLabel: string;
		previousMonth: string;
		nextMonth: string;
		todayIso: string;
		ideasById?: Record<string, RecipeIdea>;
		canEdit?: boolean;
	}

	let {
		weeks,
		month,
		monthLabel,
		previousMonth,
		nextMonth,
		todayIso,
		ideasById = {},
		canEdit = false
	}: Props = $props();

	let selectedDay = $state<DayData | null>(null);
	let sheetOpen = $state(false);
	let isDesktop = $state(false);
	let touchStartX = $state(0);
	let viewMode = $state<CalendarViewMode>('week');

	onMount(() => {
		const query = window.matchMedia('(min-width: 768px)');
		const sync = () => {
			isDesktop = query.matches;
		};
		sync();
		query.addEventListener('change', sync);
		return () => query.removeEventListener('change', sync);
	});

	const visibleLimit = $derived(
		viewMode === 'week'
			? CALENDAR_VISIBLE_MEALS.week
			: isDesktop
				? CALENDAR_VISIBLE_MEALS.desktop
				: CALENDAR_VISIBLE_MEALS.mobile
	);

	const displayWeeks = $derived(
		viewMode === 'month' ? weeks : [findWeekForDate(weeks, todayIso)]
	);

	const calendarLabel = $derived(
		viewMode === 'week' ? t('planer.weekCalendarAria') : t('planer.calendarAria')
	);

	function openDay(day: DayData) {
		selectedDay = day;
		sheetOpen = true;
	}

	function closeSheet() {
		sheetOpen = false;
	}

	function setViewMode(next: CalendarViewMode) {
		if (viewMode === next) return;
		viewMode = next;
		trackAtaWeekViewToggled(next);
	}

	function onTouchStart(event: TouchEvent) {
		touchStartX = event.changedTouches[0]?.clientX ?? 0;
	}

	function onTouchEnd(event: TouchEvent) {
		if (viewMode !== 'month') return;
		const endX = event.changedTouches[0]?.clientX ?? 0;
		const delta = endX - touchStartX;
		if (Math.abs(delta) < 72) return;
		if (delta > 0) {
			window.location.href = `/planer?month=${encodeURIComponent(previousMonth)}`;
		} else {
			window.location.href = `/planer?month=${encodeURIComponent(nextMonth)}`;
		}
	}
</script>

<section class="calendar-shell" aria-label={calendarLabel}>
	<header class="month-nav">
		<a
			href="/planer?month={previousMonth}"
			class="nav-btn"
			class:nav-btn-hidden={viewMode === 'week'}
			aria-label={t('planer.prevMonth')}
			tabindex={viewMode === 'week' ? -1 : undefined}
		>
			<span class="nav-icon" aria-hidden="true">←</span>
			<span class="nav-text">{t('planer.prevMonthShort')}</span>
		</a>

		<div class="month-title-wrap">
			<h2>{monthLabel}</h2>
			<div class="title-actions">
				<div class="view-toggle" role="group" aria-label={t('planer.viewToggleAria')}>
					<button
						type="button"
						class="view-toggle-btn"
						class:active={viewMode === 'week'}
						aria-pressed={viewMode === 'week'}
						onclick={() => setViewMode('week')}
					>
						{t('planer.viewWeek')}
					</button>
					<button
						type="button"
						class="view-toggle-btn"
						class:active={viewMode === 'month'}
						aria-pressed={viewMode === 'month'}
						onclick={() => setViewMode('month')}
					>
						{t('planer.viewMonth')}
					</button>
				</div>
				<a href="/planer" class="today-link">{t('common.today')}</a>
			</div>
		</div>

		<a
			href="/planer?month={nextMonth}"
			class="nav-btn"
			class:nav-btn-hidden={viewMode === 'week'}
			aria-label={t('planer.nextMonth')}
			tabindex={viewMode === 'week' ? -1 : undefined}
		>
			<span class="nav-text">{t('common.next')}</span>
			<span class="nav-icon" aria-hidden="true">→</span>
		</a>
	</header>

	<div
		class="calendar-card"
		class:calendar-card-week={viewMode === 'week'}
		role="region"
		aria-label={t('planer.gridAria')}
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
	>
		<div class="weekday-row" aria-hidden="true">
			{#each CALENDAR_WEEKDAY_LABELS as name}
				<div>{name}</div>
			{/each}
		</div>

		<div class="weeks">
			{#each displayWeeks as week}
				{#each week as day (day.date)}
					<CalendarDayCell
						{day}
						{todayIso}
						{visibleLimit}
						weekView={viewMode === 'week'}
						{ideasById}
						onOpen={openDay}
					/>
				{/each}
			{/each}
		</div>
	</div>
</section>

<CalendarDaySheet
	open={sheetOpen}
	day={selectedDay}
	{month}
	{ideasById}
	{canEdit}
	onClose={closeSheet}
/>

<style>
	.calendar-shell {
		min-width: 0;
	}

	.month-nav {
		position: sticky;
		top: 0;
		z-index: 5;
		display: grid;
		grid-template-columns: minmax(2.75rem, auto) 1fr minmax(2.75rem, auto);
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: color-mix(in srgb, var(--color-surface) 92%, transparent);
		backdrop-filter: blur(8px);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
	}

	.month-title-wrap {
		min-width: 0;
		text-align: center;
	}

	h2 {
		margin: 0;
		font-size: clamp(0.95rem, 2.8vw, 1.15rem);
		text-transform: capitalize;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.title-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		margin-top: 0.25rem;
	}

	.view-toggle {
		display: inline-flex;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		overflow: hidden;
		background: var(--color-surface);
	}

	.view-toggle-btn {
		min-height: 2rem;
		padding: 0.2rem 0.65rem;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}

	.view-toggle-btn.active {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
	}

	.today-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--color-primary);
		text-decoration: none;
	}

	.today-link:hover {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		text-decoration: none;
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0.35rem 0.55rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-weight: 700;
		font-size: 0.82rem;
		text-decoration: none;
		white-space: nowrap;
	}

	.nav-btn-hidden {
		visibility: hidden;
		pointer-events: none;
	}

	.nav-btn:hover {
		background: var(--color-surface-muted);
		text-decoration: none;
	}

	.nav-text {
		display: none;
	}

	@media (min-width: 480px) {
		.nav-text {
			display: inline;
		}
	}

	.calendar-card {
		min-width: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-sm);
		box-shadow: var(--shadow-sm);
	}

	.calendar-card-week :global(.day) {
		min-height: 7.5rem;
	}

	@media (min-width: 768px) {
		.calendar-card {
			padding: var(--space-md);
		}

		.calendar-card-week :global(.day) {
			min-height: 11rem;
		}
	}

	.weekday-row {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.25rem;
		margin-bottom: var(--space-xs);
		font-size: 0.68rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
	}

	@media (min-width: 768px) {
		.weekday-row {
			gap: var(--space-sm);
			font-size: 0.75rem;
			margin-bottom: var(--space-sm);
		}
	}

	.weekday-row div {
		min-width: 0;
		text-align: center;
		padding: 0.15rem 0;
	}

	.weeks {
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		gap: 0.25rem;
	}

	@media (min-width: 768px) {
		.weeks {
			gap: var(--space-sm);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.month-nav {
			backdrop-filter: none;
		}
	}
</style>
