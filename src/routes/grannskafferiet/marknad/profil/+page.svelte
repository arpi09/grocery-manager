<script lang="ts">
	import MarketAutoListingPanel from '$lib/components/organisms/MarketAutoListingPanel.svelte';
	import MarketChatPushPanel from '$lib/components/organisms/MarketChatPushPanel.svelte';
	import MarketListingSettingsPanel from '$lib/components/organisms/MarketListingSettingsPanel.svelte';
	import MarketProfilePanel from '$lib/components/organisms/MarketProfilePanel.svelte';
	import { t } from '$lib/i18n';

	let { data } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex,nofollow" />
	<title>{t('marketV05.profileTitle')} · {t('marketV01.pageTitle')}</title>
</svelte:head>

<section class="profile-view" data-testid="market-profile-page">
	<header class="profile-header">
		<h1>{t('marketV05.profileTitle')}</h1>
		<p>{t('marketV05.profileLead')}</p>
	</header>

	{#if !data.nearbyOptedIn}
		<p class="note">{t('marketV01.nearbyOptInPrompt')}</p>
		<p class="note">
			<a href="/settings#settings-nearby-sharing">{t('marketV01.nearbyOptInLink')}</a>
		</p>
	{:else}
		<MarketProfilePanel
			displayName={data.user.displayName}
			email={data.user.email}
			avatarUrl={data.user.avatarUrl}
		/>

		<MarketListingSettingsPanel
			previewItem={data.previewExpiringItem}
			autoNearbyListingEnabled={data.autoNearbyListingEnabled}
		/>

		<MarketAutoListingPanel
			autoNearbyListingEnabled={data.autoNearbyListingEnabled}
			nearbySharingEnabled={data.nearbyOptedIn}
		/>

		<MarketChatPushPanel />
	{/if}
</section>

<style>
	.profile-view {
		display: grid;
		gap: var(--space-lg);
		padding: var(--space-sm) 0 var(--space-md);
	}

	.profile-header {
		display: grid;
		gap: var(--space-2xs);
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	.profile-header p,
	.note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.95rem;
	}

	.note a {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.note a:hover {
		text-decoration: underline;
	}
</style>
