<script lang="ts">
	import SkaffuSettingsGroup from '$lib/components/molecules/SkaffuSettingsGroup.svelte';
	import SkaffuSettingsLinkRow from '$lib/components/molecules/SkaffuSettingsLinkRow.svelte';
	import type { HouseholdView } from '$lib/domain/household';
	import { t } from '$lib/i18n';

	interface Props {
		household: HouseholdView | null;
		kivraForwardAddress: string | null;
		showSuggestions: boolean;
	}

	let { household, kivraForwardAddress, showSuggestions }: Props = $props();

	const showReceiptsGroup = $derived(Boolean(kivraForwardAddress) || showSuggestions);
</script>

<div class="settings-hub">
	<SkaffuSettingsGroup label={t('settings.hub.account')}>
		<SkaffuSettingsLinkRow
			href="/settings/account"
			title={t('settings.nav.account')}
		/>
	</SkaffuSettingsGroup>

	{#if household}
		<SkaffuSettingsGroup label={t('settings.hub.household')}>
			<SkaffuSettingsLinkRow
				href="/settings/household"
				title={t('settings.nav.household')}
			/>
		</SkaffuSettingsGroup>
	{/if}

	{#if showReceiptsGroup}
		<SkaffuSettingsGroup label={t('settings.hub.receipts')}>
			{#if kivraForwardAddress}
				<SkaffuSettingsLinkRow
					href="/settings/kivra"
					title={t('settings.receiptForward.title')}
				/>
			{/if}
			{#if showSuggestions}
				<SkaffuSettingsLinkRow
					href="/settings/memory"
					title={t('memory.navTitle')}
				/>
				<SkaffuSettingsLinkRow
					href="/settings/suggestions"
					title={t('settings.suggestions.title')}
				/>
			{/if}
		</SkaffuSettingsGroup>
	{/if}

	<SkaffuSettingsGroup label={t('settings.hub.notificationsSharing')}>
		<SkaffuSettingsLinkRow
			href="/settings/notifications"
			title={t('settings.nav.notifications')}
		/>
		<SkaffuSettingsLinkRow
			href="/settings/nearby"
			title={t('nearbySharing.settingsTitle')}
		/>
	</SkaffuSettingsGroup>

	<SkaffuSettingsGroup label={t('settings.hub.app')}>
		<SkaffuSettingsLinkRow href="/settings/app" title={t('settings.nav.app')} />
	</SkaffuSettingsGroup>

	<SkaffuSettingsGroup label={t('settings.hub.plan')}>
		<SkaffuSettingsLinkRow href="/settings/plan" title={t('settings.nav.plan')} />
	</SkaffuSettingsGroup>

	<SkaffuSettingsGroup label={t('settings.hub.support')}>
		<SkaffuSettingsLinkRow href="/settings/feedback" title={t('settings.nav.feedback')} />
	</SkaffuSettingsGroup>
</div>

<style>
	.settings-hub {
		display: flex;
		flex-direction: column;
	}
</style>
