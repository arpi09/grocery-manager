<script lang="ts">
	import { getTimeOfDay, timeOfDayGreetingKey, type TimeOfDay } from '$lib/domain/meal-slot';
	import type { HomeState } from '$lib/domain/home-state';
	import { t, type MessageKey } from '$lib/i18n';

	interface Props {
		displayName?: string | null;
		totalItems: number;
		homeState: HomeState;
		shoppingListCount?: number;
	}

	let {
		displayName = null,
		totalItems,
		homeState,
		shoppingListCount = 0
	}: Props = $props();

	const GREETING_NEUTRAL_KEYS: Record<TimeOfDay, MessageKey> = {
		morning: 'home.dashboard.greetingMorningOnly',
		day: 'home.dashboard.greetingDayOnly',
		evening: 'home.dashboard.greetingEveningOnly',
		night: 'home.dashboard.greetingNightOnly'
	};

	const greeting = $derived.by(() => {
		const time = getTimeOfDay();
		const name = displayName?.trim();
		if (name) {
			return t(timeOfDayGreetingKey(time), { name });
		}
		return t(GREETING_NEUTRAL_KEYS[time]);
	});

	const subline = $derived.by(() => {
		if (homeState === 'cold') {
			return t('home.dashboard.sublineCold');
		}
		if (homeState === 'lista_ready') {
			return t('home.dashboard.sublineLista', { count: shoppingListCount });
		}
		return t('home.dashboard.sublineSteady', { count: totalItems });
	});
</script>

<header class="home-welcome" data-testid="home-welcome">
	<h1 class="greeting">{greeting}</h1>
	<p class="subline">{subline}</p>
</header>

<style>
	.home-welcome {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-sm) 0 var(--space-md);
	}

	.greeting {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
		line-height: 1.2;
		color: var(--color-text);
	}

	.subline {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
