<script lang="ts">
	import { browser } from '$app/environment';
	import SettingsDrilldownLayout from '$lib/components/templates/SettingsDrilldownLayout.svelte';
	import HouseholdSettingsPanel from '$lib/components/organisms/HouseholdSettingsPanel.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { t } from '$lib/i18n';
	import type { PageData } from './$types';

	interface HouseholdForm {
		inviteLink?: string | null;
		inviteEmailWarning?: string | null;
		householdError?: string | null;
		inviteErrors?: Record<string, string[] | undefined>;
		householdNameErrors?: Record<string, string[] | undefined>;
	}

	interface Props {
		data: PageData;
		form: HouseholdForm | null;
	}

	let { data, form }: Props = $props();

	let copiedInviteLink = $state(false);

	const inviteLink = $derived(form?.inviteLink ?? null);
	const inviteEmailWarning = $derived(form?.inviteEmailWarning ?? null);
	const householdError = $derived(form?.householdError ?? null);
	const inviteFieldErrors = $derived(form?.inviteErrors ?? {});
	const householdNameErrors = $derived(form?.householdNameErrors ?? {});

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
</script>

<SettingsDrilldownLayout
	user={data.user}
	title={t('settings.household.title')}
	subtitle={t('settings.household.description')}
>
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
</SettingsDrilldownLayout>
