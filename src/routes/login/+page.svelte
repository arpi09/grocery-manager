<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import LoginForm from '$lib/components/organisms/LoginForm.svelte';
	import AuthSeoHead from '$lib/components/seo/AuthSeoHead.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const message = $derived(form?.message ?? data.message ?? undefined);
	const pageTitle = $derived(t('auth.login.pageTitle'));
	const formTitle = $derived(t('auth.login.title'));
	const formSubtitle = $derived(t('auth.login.subtitle'));
	const metaDescription = $derived(t('auth.login.metaDescription'));
</script>

<AuthSeoHead
	title={pageTitle}
	description={metaDescription}
	canonicalUrl={data.canonicalUrl}
	locale={data.locale}
/>

<AuthLandingShell {formTitle} {formSubtitle}>
	<LoginForm
		errors={form?.errors}
		{message}
		messageTone={data.message ? 'info' : 'error'}
		email={form?.email}
		redirectTo={form?.redirectTo ?? data.redirectTo ?? undefined}
		googleOAuthEnabled={data.googleOAuthEnabled}
	/>
</AuthLandingShell>
