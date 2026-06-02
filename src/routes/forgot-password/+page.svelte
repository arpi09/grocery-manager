<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import AuthSeoHead from '$lib/components/seo/AuthSeoHead.svelte';
	import ForgotPasswordForm from '$lib/components/organisms/ForgotPasswordForm.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<AuthSeoHead
	title={t('auth.forgotPassword.pageTitle')}
	description={t('auth.forgotPassword.metaDescription')}
	canonicalUrl={data.canonicalUrl}
	locale={data.locale}
/>

<AuthLandingShell
	formTitle={t('auth.forgotPassword.title')}
	formSubtitle={t('auth.forgotPassword.subtitle')}
>
	<ForgotPasswordForm
		errors={form?.errors}
		message={form?.message}
		success={form?.success}
		email={form?.email}
		turnstileSiteKey={data.turnstileSiteKey}
		captchaRequired={data.captchaRequired}
	/>
</AuthLandingShell>
