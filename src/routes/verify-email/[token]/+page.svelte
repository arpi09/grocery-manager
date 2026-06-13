<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import AuthSeoHead from '$lib/components/seo/AuthSeoHead.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import VerifyEmailCelebrateIllustration from '$lib/components/organisms/VerifyEmailCelebrateIllustration.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<AuthSeoHead
	title={t('auth.verifyEmail.pageTitle')}
	description={t('auth.verifyEmail.metaDescription')}
	canonicalUrl={data.canonicalUrl}
	locale={data.locale}
/>

<AuthLandingShell
	formTitle={data.tokenValid ? t('auth.verifyEmail.confirmedTitle') : t('auth.verifyEmail.title')}
	formSubtitle={data.tokenValid ? t('auth.verifyEmail.confirmedBody') : t('auth.verifyEmail.subtitle')}
	hideShowcaseOnMobile={true}
>
	{#if !data.tokenValid}
		<FeedbackBanner tone="error" message={t('auth.verifyEmail.invalidToken')} />
		<p class="footer"><a href="/verify-email">{t('auth.verifyEmail.requestNew')}</a></p>
	{:else}
		<VerifyEmailCelebrateIllustration />
		{#if form?.message}
			<FeedbackBanner tone="error" message={form.message} />
		{/if}
		{#if data.householdInviteIntent}
			<p class="household-hint">
				{t('auth.verifyEmail.confirmedHouseholdHint')}
				<a href="/settings#household">{t('auth.verifyEmail.confirmedHouseholdLink')}</a>
			</p>
		{/if}
		<form method="POST">
			<Button type="submit" variant="primary" fullWidth>{t('auth.verifyEmail.goToApp')}</Button>
		</form>
	{/if}
</AuthLandingShell>

<style>
	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
	}

	.household-hint {
		margin: 0 0 var(--space-md);
		font-size: 0.875rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.household-hint a {
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
</style>
