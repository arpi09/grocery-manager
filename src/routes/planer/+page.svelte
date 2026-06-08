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

			<MealPlanIdeasPanel
				month={data.month}
				initialIdeas={data.recipeIdeas}
				onIdeasChange={handleIdeasChange}
			/>
		</section>
	</PageContainer>
</AppLayout>

<style>
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
