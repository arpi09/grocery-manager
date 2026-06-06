<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		STREAK_MILESTONE_WEEKS,
		ZERO_WASTE_STREAK_CELEBRATION
	} from '$lib/domain/gamification';
	import { getCelebrationRegistryEntry } from '$lib/domain/gamification.registry';
	import {
		CELEBRATE_PARAM,
		parseCelebrationKind
	} from '$lib/utils/gamification-celebrate';
	import { shouldShowCelebration } from '$lib/utils/gamification-celebrations';
	import { presentCelebration } from '$lib/utils/present-celebration.svelte';

	const celebrateKind = $derived(parseCelebrationKind(page.url.searchParams.get(CELEBRATE_PARAM)));
	const householdId = $derived(page.data.activeHousehold?.id ?? page.data.householdId ?? null);

	function clearCelebrateParam() {
		const url = new URL(page.url);
		url.searchParams.delete(CELEBRATE_PARAM);
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function celebrationMetadata(kind: NonNullable<typeof celebrateKind>) {
		if (kind === 'zeroWasteStreak') {
			return { count: ZERO_WASTE_STREAK_CELEBRATION, weeks: ZERO_WASTE_STREAK_CELEBRATION };
		}
		if (kind === 'streak5') {
			return { count: STREAK_MILESTONE_WEEKS, weeks: STREAK_MILESTONE_WEEKS };
		}
		if (kind === 'savings500') {
			return { sek: 500, milestoneId: 'savings500' as const };
		}
		if (kind === 'firstConsumption') {
			return { milestoneId: 'firstConsumption' as const };
		}
		if (kind === 'weeklyRitualFirst') {
			return { milestoneId: 'weeklyRitualFirst' as const };
		}
		return undefined;
	}

	$effect(() => {
		if (!browser || !celebrateKind || !householdId) {
			return;
		}

		if (!shouldShowCelebration(celebrateKind, householdId)) {
			clearCelebrateParam();
			return;
		}

		const entry = getCelebrationRegistryEntry(celebrateKind);
		const surface = entry?.defaultSurface ?? 'toast';

		presentCelebration({
			kind: celebrateKind,
			surface,
			householdId,
			userId: page.data.user?.id ?? null,
			metadata: celebrationMetadata(celebrateKind)
		});
		clearCelebrateParam();
	});
</script>
