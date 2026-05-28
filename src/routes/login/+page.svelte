<script lang="ts">
	import AuthLayout from '$lib/components/templates/AuthLayout.svelte';
	import LoginForm from '$lib/components/organisms/LoginForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<AuthLayout title="Sign in" subtitle="Track what's in your kitchen">
	<LoginForm errors={form?.errors} message={form?.message} email={form?.email} />
</AuthLayout>
