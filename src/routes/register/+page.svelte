<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import RegisterForm from '$lib/components/organisms/RegisterForm.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const pageTitle = $derived(t('auth.register.pageTitle'));
	const formTitle = $derived(t('auth.register.title'));
	const formSubtitle = $derived(t('auth.register.subtitle'));
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<AuthLandingShell {formTitle} {formSubtitle}>
	<RegisterForm
		errors={form?.errors}
		message={form?.message}
		email={form?.email}
		turnstileSiteKey={data.turnstileSiteKey}
		captchaRequired={data.captchaRequired}
	/>
</AuthLandingShell>
