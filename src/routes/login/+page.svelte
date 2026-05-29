<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import LoginForm from '$lib/components/organisms/LoginForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const message = $derived(form?.message ?? data.message ?? undefined);
</script>

<svelte:head>
	<title>Logga in · Home Pantry</title>
</svelte:head>

<AuthLandingShell formTitle="Logga in" formSubtitle="Skafferi · datum · inköp">
	<LoginForm
		errors={form?.errors}
		{message}
		messageTone={data.message ? 'info' : 'error'}
		email={form?.email}
		redirectTo={form?.redirectTo ?? data.redirectTo ?? undefined}
	/>
</AuthLandingShell>
