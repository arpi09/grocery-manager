<script lang="ts">
	import AuthLandingShell from '$lib/components/templates/AuthLandingShell.svelte';
	import RegisterForm from '$lib/components/organisms/RegisterForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Skapa konto · Home Pantry</title>
</svelte:head>

<AuthLandingShell formTitle="Skapa konto" formSubtitle="Ditt hushåll, en app">
	<RegisterForm
		errors={form?.errors}
		message={form?.message}
		email={form?.email}
		turnstileSiteKey={data.turnstileSiteKey}
	/>
</AuthLandingShell>
