<script lang="ts">
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import PantrySwitcher from '$lib/components/molecules/PantrySwitcher.svelte';
	import ProfileMenu from '$lib/components/molecules/ProfileMenu.svelte';
	import { APP_HOME_PATH } from '$lib/navigation/app-home';
	import type { UserHouseholdSummary } from '$lib/domain/household';
	import { t } from '$lib/i18n';
	import type { NavUser } from '$lib/navigation/nav-config';

	interface Props {
		user: NavUser & { email: string };
		households: UserHouseholdSummary[];
		activeHousehold: { id: string; name: string } | null;
		memberCount?: number;
	}

	let { user, households, activeHousehold, memberCount = 0 }: Props = $props();

	const householdLabel = $derived(
		activeHousehold
			? t('home.v6.householdSwitcher', {
					name: activeHousehold.name,
					count: memberCount
				})
			: null
	);
</script>

<header class="home-briefing-header" data-testid="home-briefing-header">
	<div class="brand-row">
		<a href={APP_HOME_PATH} class="brand" aria-label={t('home.v6.brandAria')}>
			<AppLogo size="sm" />
			<span class="brand-text">{t('nav.brandName')}</span>
		</a>
		<ProfileMenu {user} />
	</div>

	{#if activeHousehold && householdLabel}
		<div class="household-row">
			<PantrySwitcher {households} {activeHousehold} />
			<span class="household-label" aria-hidden="true">{householdLabel}</span>
		</div>
	{/if}
</header>

<style>
	.home-briefing-header {
		display: none;
		flex-direction: column;
		gap: var(--space-xs);
		padding: var(--space-xs) 0 var(--space-sm);
	}

	.brand-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 2.75rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 0.875rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--color-text);
		text-decoration: none;
	}

	.brand-text {
		line-height: 1;
	}

	.household-row {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding-top: var(--space-xs);
		border-top: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
	}

	.household-label {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
