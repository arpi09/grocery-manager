<script lang="ts">
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { canEditInventory } from '$lib/domain/household';
	import type { RecipeIdea } from '$lib/domain/meal-plan';
	import { ideasByIdFromList } from '$lib/utils/meal-plan-ideas';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import MealPlanCalendar from '$lib/components/organisms/MealPlanCalendar.svelte';
	import MealPlanIdeasPanel from '$lib/components/organisms/MealPlanIdeasPanel.svelte';
	import PlanerContextBanner from '$lib/components/molecules/PlanerContextBanner.svelte';
	import EatHubHero from '$lib/components/molecules/EatHubHero.svelte';

	let { data } = $props();

	const todayIso = new Date().toISOString().slice(0, 10);
	const canEdit = $derived(
		page.data.householdRole ? canEditInventory(page.data.householdRole) : false
	);

	let ideasById = $state<Record<string, RecipeIdea>>(ideasByIdFromList(data.recipeIdeas));
	let calendarOpen = $state(data.plannedMealCount > 0);

	function handleIdeasChange(ideas: RecipeIdea[]) {
		ideasById = ideasByIdFromList(ideas);
	}
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('planer.title')} subtitle={t('planer.subtitle')} />

	<PageContainer>
		<EatHubHero />
		<PlanerContextBanner
			expiringSoon={data.expiringSoon}
			plannedMealCount={data.plannedMealCount}
		/>
		<section class="planner-grid">
			<details class="calendar-fold" bind:open={calendarOpen}>
				<summary>
					{data.plannedMealCount > 0
						? t('planer.calendarSummary', { count: data.plannedMealCount })
						: t('planer.calendarExpand')}
				</summary>
				<div class="calendar-body">
					<MealPlanCalendar
						weeks={data.weeks}
						month={data.month}
						monthLabel={data.monthLabel}
						previousMonth={data.previousMonth}
						nextMonth={data.nextMonth}
						{todayIso}
						{ideasById}
						{canEdit}
					/>
				</div>
			</details>

			<MealPlanIdeasPanel
				month={data.month}
				initialIdeas={data.recipeIdeas}
				onIdeasChange={handleIdeasChange}
			/>
		</section>
	</PageContainer>
</AppLayout>

<style>
	.calendar-fold {
		min-width: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.calendar-fold > summary {
		display: flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: var(--space-md) var(--space-lg);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	.calendar-fold > summary::-webkit-details-marker {
		display: none;
	}

	.calendar-fold > summary::after {
		content: '▾';
		margin-left: auto;
		color: var(--color-text-muted);
		transition: transform 0.15s;
	}

	.calendar-fold[open] > summary::after {
		transform: rotate(180deg);
	}

	.calendar-body {
		padding: 0 var(--space-md) var(--space-md);
		min-width: 0;
	}

	.planner-grid {
		display: grid;
		grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
		gap: var(--page-section-gap);
		align-items: start;
		min-width: 0;
	}

	@media (max-width: 1100px) {
		.planner-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
