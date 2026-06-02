<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Toast from '$lib/components/molecules/Toast.svelte';
	import { ZERO_WASTE_STREAK_CELEBRATION } from '$lib/domain/gamification';
	import { getLocale } from '$lib/i18n';
	import {
		CELEBRATE_PARAM,
		celebrationMessage,
		parseCelebrationKind
	} from '$lib/utils/gamification-celebrate';
	import {
		markCelebrationShown,
		shouldShowCelebration
	} from '$lib/utils/gamification-celebrations';

	const celebrateKind = $derived(parseCelebrationKind(page.url.searchParams.get(CELEBRATE_PARAM)));
	const householdId = $derived(page.data.activeHousehold?.id ?? page.data.householdId ?? null);

	let visible = $state(false);
	let message = $state('');

	$effect(() => {
		if (!browser || !celebrateKind || !householdId) {
			visible = false;
			message = '';
			return;
		}

		if (!shouldShowCelebration(celebrateKind, householdId)) {
			clearCelebrateParam();
			visible = false;
			message = '';
			return;
		}

		message = celebrationMessage(getLocale(), celebrateKind, {
			count: ZERO_WASTE_STREAK_CELEBRATION
		});
		visible = true;
	});

	function clearCelebrateParam() {
		const url = new URL(page.url);
		url.searchParams.delete(CELEBRATE_PARAM);
		const next = `${url.pathname}${url.search}${url.hash}`;
		void goto(next, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleDismiss() {
		if (celebrateKind && householdId) {
			markCelebrationShown(celebrateKind, householdId);
		}
		visible = false;
		clearCelebrateParam();
	}
</script>

<Toast {message} {visible} onDismiss={handleDismiss} />
