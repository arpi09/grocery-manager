<script lang="ts">
	import AuthLayout from '$lib/components/templates/AuthLayout.svelte';
	import RegisterForm from '$lib/components/organisms/RegisterForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<AuthLayout title="Create account" subtitle="Your pantry, your data">
	<RegisterForm errors={form?.errors} message={form?.message} email={form?.email} />
</AuthLayout>
