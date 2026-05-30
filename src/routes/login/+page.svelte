<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import LoginForm from '$lib/components/organisms/LoginForm.svelte';
	import { t } from '$lib/i18n';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const message = $derived(form?.message ?? data.message ?? undefined);
	const pageTitle = $derived(t('auth.login.pageTitle'));
	const formTitle = $derived(t('auth.login.title'));
	const formSubtitle = $derived(t('auth.login.subtitle'));
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<AuthLandingShell {formTitle} {formSubtitle}>
	<LoginForm
		errors={form?.errors}
		{message}
		messageTone={data.message ? 'info' : 'error'}
		email={form?.email}
		redirectTo={form?.redirectTo ?? data.redirectTo ?? undefined}
	/>
</AuthLandingShell>
