<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import AuthSeoHead from '$lib/components/seo/AuthSeoHead.svelte';
	import ResetPasswordForm from '$lib/components/organisms/ResetPasswordForm.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<AuthSeoHead
	title={t('auth.resetPassword.pageTitle')}
	description={t('auth.resetPassword.metaDescription')}
	canonicalUrl={data.canonicalUrl}
	locale={data.locale}
/>

<AuthLandingShell
	formTitle={t('auth.resetPassword.title')}
	formSubtitle={t('auth.resetPassword.subtitle')}
>
	{#if !data.tokenValid}
		<FeedbackBanner tone="error" message={t('auth.resetPassword.invalidToken')} />
		<p class="footer"><a href="/forgot-password">{t('auth.resetPassword.requestNew')}</a></p>
	{:else}
		<ResetPasswordForm errors={form?.errors} message={form?.message} />
	{/if}
</AuthLandingShell>

<style>
	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
	}
</style>
