<script lang="ts">
	import AuthLayout from '$lib/components/templates/AuthLayout.svelte';
	import LoginForm from '$lib/components/organisms/LoginForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const message = $derived(form?.message ?? data.message ?? undefined);
</script>

<AuthLayout title="Sign in" subtitle="Track what's in your kitchen">
	<LoginForm
		errors={form?.errors}
		{message}
		messageTone={data.message ? 'info' : 'error'}
		email={form?.email}
		redirectTo={form?.redirectTo ?? data.redirectTo ?? undefined}
	/>
</AuthLayout>
