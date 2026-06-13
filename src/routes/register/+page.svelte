<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import RegisterForm from '$lib/components/organisms/RegisterForm.svelte';
	import AuthSeoHead from '$lib/components/seo/AuthSeoHead.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const pageTitle = $derived(t('auth.register.pageTitle'));
	const formTitle = $derived(t('auth.register.title'));
	const formSubtitle = $derived(t('auth.register.subtitle'));
	const metaDescription = $derived(t('auth.register.metaDescription'));
</script>

<AuthSeoHead
	title={pageTitle}
	description={metaDescription}
	canonicalUrl={data.canonicalUrl}
	locale={data.locale}
/>

<AuthLandingShell {formTitle} {formSubtitle}>
	<RegisterForm
		errors={form?.errors}
		message={form?.message}
		email={form?.email}
		redirectTo={form?.redirectTo ?? data.redirectTo ?? undefined}
		turnstileSiteKey={data.turnstileSiteKey}
		captchaRequired={data.captchaRequired}
		googleOAuthEnabled={data.googleOAuthEnabled}
	/>
</AuthLandingShell>
