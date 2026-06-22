<script lang="ts">
	import { enhance } from '$app/forms';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import PageContainer from '$lib/components/molecules/PageContainer.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import ProfileAvatarUpload from '$lib/components/organisms/ProfileAvatarUpload.svelte';
	import { THEME_PREFERENCES, type ThemePreference } from '$lib/domain/theme';
	import { themeLabel } from '$lib/i18n/domain-labels';
	import { getLocale, t } from '$lib/i18n';
	import { userInitials } from '$lib/domain/user';

	let { data, form } = $props();

	const profile = $derived(data.profile);
	const displayName = $derived(form?.values?.displayName ?? profile.displayName ?? '');
	const initials = $derived(userInitials(profile.displayName, profile.email));
	const selectedTheme = $derived(
		(form?.themePreference as ThemePreference | undefined) ?? data.themePreference
	);

	let avatarUrl = $state<string | null>(data.profile.avatarUrl ?? null);
	let profileSubmitting = $state(false);
	let themeSubmitting = $state(false);

	$effect(() => {
		avatarUrl = data.profile.avatarUrl ?? null;
	});

	const avatarFormError = $derived(
		form?.avatarErrors?.avatarUrl?.[0] as string | undefined
	);

	const showAvatarSuccess = $derived(Boolean(form?.avatarSuccess));
</script>

<AppLayout user={data.user}>
	<AppHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
	<PageContainer>
	<Card>
		{#if showAvatarSuccess}
			<FeedbackBanner tone="success" message={t('profile.avatarUpdated')} />
		{/if}

		<ProfileAvatarUpload bind:avatarUrl {initials} error={avatarFormError} />

		<form
			method="POST"
			action="?/save"
			class="profile-form"
			use:enhance={() => {
				profileSubmitting = true;
				return async ({ update }) => {
					try {
						await update({ invalidateAll: true });
					} finally {
						profileSubmitting = false;
					}
				};
			}}
		>
			<FormField
				label={t('profile.displayName')}
				name="displayName"
				type="text"
				autocomplete="name"
				value={displayName}
				error={form?.errors?.displayName?.[0]}
				placeholder={t('profile.displayNamePlaceholder')}
			/>

			<FormField
				label={t('common.email')}
				name="email"
				type="email"
				value={profile.email}
				readonly
				disabled
			/>

			<input type="hidden" name="avatarUrl" value={avatarUrl ?? ''} />

			<Button type="submit" loading={profileSubmitting} loadingLabel={t('common.saving')}>
				{t('profile.saveProfile')}
			</Button>
		</form>
	</Card>

	<Card>
		<h2 class="section-title">{t('marketV01.profileTitle')}</h2>
		<p class="section-lead">{t('marketV01.profileLead')}</p>
		<form
			method="POST"
			action="?/saveMarketProfile"
			class="profile-form"
			use:enhance={() => {
				profileSubmitting = true;
				return async ({ update }) => {
					try {
						await update({ invalidateAll: true });
					} finally {
						profileSubmitting = false;
					}
				};
			}}
		>
			<FormField
				label={t('marketV01.profileFirstNameLabel')}
				name="marketFirstName"
				type="text"
				autocomplete="given-name"
				value={profile.marketFirstName ?? ''}
				placeholder={t('marketV01.profileFirstNamePlaceholder')}
			/>
			<Button type="submit" loading={profileSubmitting} loadingLabel={t('common.saving')}>
				{t('marketV01.profileSaveBtn')}
			</Button>
		</form>
	</Card>

	<Card>
		<h2 class="section-title">{t('profile.themeTitle')}</h2>
		<p class="section-lead">{t('profile.themeLead')}</p>

		{#if form?.themeSuccess}
			<FeedbackBanner tone="success" message={t('profile.themeSaved')} />
		{/if}

		<form
			method="POST"
			action="?/updateTheme"
			class="theme-form"
			use:enhance={() => {
				themeSubmitting = true;
				return async ({ update }) => {
					try {
						await update({ invalidateAll: true });
					} finally {
						themeSubmitting = false;
					}
				};
			}}
		>
			<fieldset class="theme-options">
				<legend class="sr-only">{t('profile.themeTitle')}</legend>
				{#each THEME_PREFERENCES as preference (preference)}
					<label class="theme-option">
						<input
							type="radio"
							name="themePreference"
							value={preference}
							checked={selectedTheme === preference}
						/>
						<span>{themeLabel(getLocale(), preference)}</span>
					</label>
				{/each}
			</fieldset>
			{#if form?.themeErrors?.themePreference?.[0]}
				<p class="theme-error" role="alert">{form.themeErrors.themePreference[0]}</p>
			{/if}
			<Button type="submit" loading={themeSubmitting} loadingLabel={t('common.saving')}>{t('profile.saveTheme')}</Button>
		</form>
	</Card>
	</PageContainer>
</AppLayout>

<style>
	.profile-form,
	.theme-form {
		display: flex;
		flex-direction: column;
	}

	.section-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.1rem;
	}

	.section-lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.theme-options {
		margin: 0 0 var(--space-md);
		padding: 0;
		border: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--touch-target-min);
		padding: 0.25rem 0;
		cursor: pointer;
	}

	.theme-option input {
		width: 1.125rem;
		height: 1.125rem;
		flex-shrink: 0;
	}

	.theme-error {
		margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
		color: var(--color-danger, #b42318);
		font-size: 0.9rem;
	}

	.sr-only {
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
