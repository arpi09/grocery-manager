<script lang="ts">
	import MainNavDesktop from '$lib/components/organisms/MainNavDesktop.svelte';
	import MainNavMobile from '$lib/components/organisms/MainNavMobile.svelte';
	import {
		NAV_ITEMS,
		filterNavItems,
		splitNavItems,
		type NavUser
	} from '$lib/navigation/nav-config';
	import type { UserHouseholdSummary } from '$lib/domain/household';

	interface Props {
		user: (NavUser & { email: string }) | null;
		households?: UserHouseholdSummary[];
		activeHousehold?: { id: string; name: string } | null;
		staleCount?: number;
		canWrite?: boolean;
	}

	let {
		user,
		households = [],
		activeHousehold = null,
		staleCount = 0,
		canWrite = false
	}: Props = $props();

	const visibleItems = $derived(filterNavItems(NAV_ITEMS, user));
	const { primary, headerUtility, secondary } = $derived(splitNavItems(visibleItems));

	let moreOpen = $state(false);

	function closeMore() {
		moreOpen = false;
	}

	function toggleMore() {
		moreOpen = !moreOpen;
	}
</script>

{#if user}
	<div class="main-nav-mobile">
		<div class="main-nav-shell">
			<MainNavMobile
				section="header"
				{user}
				{households}
				{activeHousehold}
				{primary}
				{headerUtility}
				{secondary}
				{staleCount}
				{canWrite}
				{moreOpen}
				onToggleMore={toggleMore}
				onCloseMore={closeMore}
			/>
		</div>
		<MainNavMobile
			section="bottom"
			{user}
			{households}
			{activeHousehold}
			{primary}
			{headerUtility}
			{secondary}
			{staleCount}
			{canWrite}
			{moreOpen}
			onToggleMore={toggleMore}
			onCloseMore={closeMore}
		/>
	</div>
	<div class="main-nav-desktop">
		<div class="main-nav-shell">
			<MainNavDesktop
				{user}
				{households}
				{activeHousehold}
				{primary}
				{headerUtility}
				{secondary}
				{staleCount}
				{canWrite}
				{moreOpen}
				onToggleMore={toggleMore}
				onCloseMore={closeMore}
			/>
		</div>
	</div>
{/if}

<style>
	.main-nav-shell {
		position: sticky;
		top: 0;
		z-index: var(--z-nav-header);
		width: 100%;
		max-width: 100%;
		min-width: 0;
		background: var(--nav-surface);
		border-bottom: 1px solid var(--nav-border);
		box-shadow: var(--nav-header-shadow);
		margin-bottom: var(--space-sm);
	}

	.main-nav-mobile {
		display: block;
	}

	.main-nav-desktop {
		display: none;
	}

	@media (min-width: 900px) {
		.main-nav-mobile {
			display: none;
		}

		.main-nav-desktop {
			display: block;
		}

		.main-nav-shell {
			margin-bottom: var(--space-lg);
		}
	}
</style>
