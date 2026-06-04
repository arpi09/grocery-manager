<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import AuthSeoHead from '$lib/components/seo/AuthSeoHead.svelte';
	import RegistrationWelcome from '$lib/components/organisms/RegistrationWelcome.svelte';
	import VerifyEmailPanel from '$lib/components/organisms/VerifyEmailPanel.svelte';
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

<AuthLandingShell formTitle={t('auth.verifyEmail.title')} formSubtitle={t('auth.verifyEmail.subtitle')}>
	<RegistrationWelcome />
	<VerifyEmailPanel email={data.email} success={form?.success} />
</AuthLandingShell>
