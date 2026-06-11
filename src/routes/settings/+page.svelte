<script lang="ts">

	import AppLayout from '$lib/components/templates/AppLayout.svelte';

	import PageContainer from '$lib/components/molecules/PageContainer.svelte';

	import AccountSettingsPanel from '$lib/components/organisms/AccountSettingsPanel.svelte';

	import AppSettingsPanel from '$lib/components/organisms/AppSettingsPanel.svelte';

	import FeedbackSettingsPanel from '$lib/components/organisms/FeedbackSettingsPanel.svelte';

	import HouseholdSettingsPanel from '$lib/components/organisms/HouseholdSettingsPanel.svelte';

	import KivraForwardSettingsPanel from '$lib/components/organisms/KivraForwardSettingsPanel.svelte';

	import NearbySharingSettingsPanel from '$lib/components/organisms/NearbySharingSettingsPanel.svelte';
	import NotificationSettingsPanel from '$lib/components/organisms/NotificationSettingsPanel.svelte';

	import PlanSettingsPanel from '$lib/components/organisms/PlanSettingsPanel.svelte';

	import ProActivationCelebration from '$lib/components/organisms/ProActivationCelebration.svelte';

	import ProUpgradeCta from '$lib/components/molecules/ProUpgradeCta.svelte';

	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';

	import SettingsPageChrome from '$lib/components/molecules/SettingsPageChrome.svelte';

	import { type SettingsNavItem } from '$lib/components/molecules/SettingsSectionNav.svelte';

	import { browser } from '$app/environment';

	import { t } from '$lib/i18n';



	let { data, form } = $props();



	let copiedInviteLink = $state(false);



	const inviteLink = $derived(form?.inviteLink ?? null);

	const inviteEmailWarning = $derived(form?.inviteEmailWarning ?? null);

	const householdError = $derived(form?.householdError ?? null);

	const inviteFieldErrors = $derived(form?.inviteErrors ?? {});

	const householdNameErrors = $derived(

		(form as { householdNameErrors?: Record<string, string[] | undefined> } | null)

			?.householdNameErrors ?? {}

	);

	const feedbackErrors = $derived(form?.feedbackErrors ?? {});

	const feedbackSuccess = $derived(form?.feedbackSuccess === true);

	const shoppingPushError = $derived(

		(form as { shoppingPushError?: string } | null)?.shoppingPushError ?? null

	);



	async function copyInviteLink(link: string) {

		if (!browser) return;

		await navigator.clipboard.writeText(link);

		copiedInviteLink = true;

		setTimeout(() => {

			copiedInviteLink = false;

		}, 2000);

	}



	async function shareInviteLink(link: string) {

		if (!browser || !navigator.share) {

			await copyInviteLink(link);

			return;

		}

		try {

			await navigator.share({

				title: t('household.shareInvite'),

				text: t('household.shareInviteNote'),

				url: link

			});

		} catch (error) {

			if (error instanceof DOMException && error.name === 'AbortError') {

				return;

			}

			await copyInviteLink(link);

		}

	}



	const settingsNavItems = $derived.by((): SettingsNavItem[] => {

		const items: SettingsNavItem[] = [

			{ id: 'settings-account', label: t('settings.nav.account') },

			...(data.household

				? [{ id: 'settings-household', label: t('settings.nav.household') }]

				: []),

			...(data.kivraForwardAddress

				? [{ id: 'settings-kivra-forward', label: t('settings.kivraForward.title') }]

				: []),

			{ id: 'settings-notifications', label: t('settings.nav.notifications') },

			{ id: 'settings-nearby-sharing', label: t('nearbySharing.settingsTitle') },

			{ id: 'settings-app', label: t('settings.nav.app') },

			{ id: 'settings-plan', label: t('settings.nav.plan') },

			{ id: 'settings-feedback', label: t('settings.nav.feedback') }

		];

		return items;

	});

</script>



<AppLayout user={data.user}>

	<PageContainer>

		<div class="settings-page">

			{#if !data.isPro}

				<ProUpgradeCta variant="banner" class="settings-pro-banner" />

			{/if}



			<SettingsPageChrome

				title={t('settings.title')}

				subtitle={t('settings.subtitle')}

				items={settingsNavItems}

			/>



			<AccountSettingsPanel email={data.user?.email ?? ''} />



			{#if data.household}

				<SettingsSection

					id="settings-household"

					title={t('settings.household.title')}

					description={t('settings.household.description')}

				>

					<HouseholdSettingsPanel

						household={data.household}

						isOwner={data.isOwner}

						householdRole={data.householdRole}

						pendingInvites={data.pendingInvites}

						currentUserId={data.user?.id ?? ''}

						{householdError}

						{inviteFieldErrors}

						{inviteLink}

						{inviteEmailWarning}

						{householdNameErrors}

						copiedInviteLink={copiedInviteLink}

						onCopyInviteLink={copyInviteLink}

						onShareInviteLink={shareInviteLink}

					/>

				</SettingsSection>

			{/if}



			{#if data.kivraForwardAddress}

				<SettingsSection

					id="settings-kivra-forward"

					title={t('settings.kivraForward.title')}

					description={t('settings.kivraForward.description')}

				>

					<KivraForwardSettingsPanel forwardAddress={data.kivraForwardAddress} />

				</SettingsSection>

			{/if}



			<NearbySharingSettingsPanel
				nearbySharingEnabled={data.nearbySharingEnabled}
				nearbyPushEnabled={data.nearbyPushEnabled}
				pushNotificationsEnabled={data.pushNotificationsEnabled}
			/>

			<NotificationSettingsPanel

				expiryRemindersEnabled={data.expiryRemindersEnabled}

				expiryReminderDays={data.expiryReminderDays}

				autoExpiredGraceDays={data.autoExpiredGraceDays}

				pushNotificationsEnabled={data.pushNotificationsEnabled}

				shoppingPushEnabled={data.shoppingPushEnabled}

				shoppingToPantryMode={data.shoppingToPantryMode}

				{shoppingPushError}

			/>



			<AppSettingsPanel

				userId={data.user?.id}

				petsEnabled={data.petsEnabled}

				pets={data.pets}

			/>



			<PlanSettingsPanel

				isPro={data.isPro}

				isAdmin={data.isAdmin}

				isOwner={data.isOwner}

				stripeCheckoutEnabled={data.stripeCheckoutEnabled}

				checkoutStatus={data.checkoutStatus}

				planLimits={data.planLimits}

				billing={data.billing}

				userEmail={data.user?.email ?? ''}

				{form}

			/>



			<FeedbackSettingsPanel {feedbackSuccess} {feedbackErrors} />

		</div>

	</PageContainer>



	<ProActivationCelebration show={data.checkoutStatus === 'success'} isPro={data.isPro} />

</AppLayout>



<style>

	.settings-page {

		display: flex;

		flex-direction: column;

		gap: 0;

		--settings-anchor-offset: calc(var(--sticky-below-header) + 6.25rem);

		scroll-padding-top: var(--settings-anchor-offset);

	}



	@media (min-width: 720px) {

		.settings-page {

			--settings-anchor-offset: calc(var(--sticky-below-header) + 7.75rem);

		}

	}



	:global(.settings-pro-banner) {

		margin-bottom: var(--space-md);

	}

</style>

