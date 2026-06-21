<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n';
	import { trackAtaWeekViewToggled } from '$lib/client/ata-telemetry';
	import CalendarDayCell from '$lib/components/molecules/CalendarDayCell.svelte';
	import CalendarDaySheet from '$lib/components/molecules/CalendarDaySheet.svelte';
	import CalendarWeekDayList from '$lib/components/molecules/CalendarWeekDayList.svelte';
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
		focusedWeekStart: string;
		previousWeek: string;
		nextWeek: string;
		weekRangeLabel: string;
		todayWeekStart: string;
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
		focusedWeekStart,
		previousWeek,
		nextWeek,
		weekRangeLabel,
		todayWeekStart,
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

	const displayWeek = $derived(findWeekForDate(weeks, focusedWeekStart));

	const displayWeeks = $derived(viewMode === 'month' ? weeks : [displayWeek]);

	const calendarLabel = $derived(
		viewMode === 'week' ? t('planer.weekCalendarAria') : t('planer.calendarAria')
	);

	const gridSwipeHint = $derived(
		viewMode === 'week' ? t('planer.gridSwipeWeekAria') : t('planer.gridSwipeMonthAria')
	);

	const todayHref = $derived(
		viewMode === 'week'
			? `/planer?week=${encodeURIComponent(todayWeekStart)}`
			: '/planer'
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

	function navigateWeek(deltaWeeks: -1 | 1) {
		const target = deltaWeeks === -1 ? previousWeek : nextWeek;
		void goto(`/planer?week=${encodeURIComponent(target)}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function navigateMonth(deltaMonths: -1 | 1) {
		const target = deltaMonths === -1 ? previousMonth : nextMonth;
		void goto(`/planer?month=${encodeURIComponent(target)}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function navigateToday() {
		void goto(todayHref, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}

	function onTouchStart(event: TouchEvent) {
		touchStartX = event.changedTouches[0]?.clientX ?? 0;
	}

	function onTouchEnd(event: TouchEvent) {
		const endX = event.changedTouches[0]?.clientX ?? 0;
		const delta = endX - touchStartX;
		if (Math.abs(delta) < 72) return;

		if (viewMode === 'week') {
			navigateWeek(delta > 0 ? -1 : 1);
			return;
		}

		navigateMonth(delta > 0 ? -1 : 1);
	}
</script>

<section class="calendar-shell" aria-label={calendarLabel}>
	<header class="month-nav">
		{#if viewMode === 'week'}
			<button
				type="button"
				class="nav-btn"
				data-testid="ata-calendar-prev-week"
				aria-label={t('planer.prevWeek')}
				onclick={() => navigateWeek(-1)}
			>
				<span class="nav-icon" aria-hidden="true">←</span>
				<span class="nav-text">{t('planer.prevWeekShort')}</span>
			</button>
		{:else}
			<button
				type="button"
				class="nav-btn"
				data-testid="ata-calendar-prev-month"
				aria-label={t('planer.prevMonth')}
				onclick={() => navigateMonth(-1)}
			>
				<span class="nav-icon" aria-hidden="true">←</span>
				<span class="nav-text">{t('planer.prevMonthShort')}</span>
			</button>
		{/if}

		<div class="month-title-wrap">
			{#if viewMode === 'week'}
				<h2 data-testid="ata-calendar-week-range" aria-live="polite">{weekRangeLabel}</h2>
			{:else}
				<h2 aria-live="polite">{monthLabel}</h2>
			{/if}
			<div class="title-actions">
				<div class="view-toggle" role="tablist" aria-label={t('planer.viewToggleAria')}>
					<button
						type="button"
						class="view-toggle-btn"
						role="tab"
						class:active={viewMode === 'week'}
						aria-selected={viewMode === 'week'}
						data-testid="ata-calendar-view-week"
						onclick={() => setViewMode('week')}
					>
						{t('planer.viewWeek')}
					</button>
					<button
						type="button"
						class="view-toggle-btn"
						role="tab"
						class:active={viewMode === 'month'}
						aria-selected={viewMode === 'month'}
						data-testid="ata-calendar-view-month"
						onclick={() => setViewMode('month')}
					>
						{t('planer.viewMonth')}
					</button>
				</div>
				<button type="button" class="today-link" data-testid="ata-calendar-today" onclick={navigateToday}>
					{t('common.today')}
				</button>
			</div>
		</div>

		{#if viewMode === 'week'}
			<button
				type="button"
				class="nav-btn"
				data-testid="ata-calendar-next-week"
				aria-label={t('planer.nextWeek')}
				onclick={() => navigateWeek(1)}
			>
				<span class="nav-text">{t('common.next')}</span>
				<span class="nav-icon" aria-hidden="true">→</span>
			</button>
		{:else}
			<button
				type="button"
				class="nav-btn"
				data-testid="ata-calendar-next-month"
				aria-label={t('planer.nextMonth')}
				onclick={() => navigateMonth(1)}
			>
				<span class="nav-text">{t('common.next')}</span>
				<span class="nav-icon" aria-hidden="true">→</span>
			</button>
		{/if}
	</header>

	<div
		class="calendar-card"
		class:calendar-card-week={viewMode === 'week'}
		class:calendar-card-mobile-week={viewMode === 'week' && !isDesktop}
		role="region"
		aria-label={gridSwipeHint}
		ontouchstart={onTouchStart}
		ontouchend={onTouchEnd}
	>
		{#if viewMode === 'week' && !isDesktop}
			<CalendarWeekDayList
				week={displayWeek}
				{todayIso}
				{visibleLimit}
				{ideasById}
				onOpen={openDay}
			/>
		{:else}
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
		{/if}
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
		grid-template-columns: minmax(var(--touch-target-min), auto) 1fr minmax(var(--touch-target-min), auto);
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
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.75rem;
		border: none;
		background: transparent;
		color: var(--color-text-muted);
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
	}

	.view-toggle-btn.active {
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
	}

	.view-toggle-btn:focus-visible,
	.today-link:focus-visible,
	.nav-btn:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
	}

	.today-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.75rem;
		border: none;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--color-primary);
		background: transparent;
		cursor: pointer;
	}

	.today-link:hover {
		background: color-mix(in srgb, var(--color-primary) 10%, transparent);
	}

	.nav-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;
		min-width: var(--touch-target-min);
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.55rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-weight: 700;
		font-size: 0.82rem;
		white-space: nowrap;
		cursor: pointer;
	}

	.nav-btn:hover {
		background: var(--color-surface-muted);
	}

	.nav-text {
		display: none;
	}

	@media (min-width: 480px) {
		.nav-text {
			display: inline;
		}
	}

	@media (max-width: 767px) {
		.month-nav {
			grid-template-columns: 1fr;
			grid-template-rows: auto auto;
			row-gap: var(--space-xs);
		}

		.month-nav > .nav-btn:first-child {
			grid-row: 2;
			justify-self: start;
		}

		.month-nav > .month-title-wrap {
			grid-row: 1;
			grid-column: 1 / -1;
		}

		.month-nav > .nav-btn:last-child {
			grid-row: 2;
			justify-self: end;
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

	.calendar-card-mobile-week {
		padding: var(--space-sm);
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
