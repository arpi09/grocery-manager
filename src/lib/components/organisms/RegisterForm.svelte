<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
		email?: string;
	}

	let { errors = {}, message, email = '' }: Props = $props();

	let submitting = $state(false);
</script>

<form
	method="POST"
	action="?/register"
	class="form"
	use:enhance={() => {
		submitting = true;
		return async ({ result, update }) => {
			submitting = false;
			if (result.type === 'redirect') {
				await goto(result.location, { invalidateAll: true });
				return;
			}
			await update();
		};
	}}
>
	{#if message}
		<p class="banner error" role="alert">{message}</p>
	{/if}

	<FormField
		label="Email"
		name="email"
		type="email"
		autocomplete="email"
		value={email}
		error={errors.email?.[0]}
	/>
	<FormField
		label="Password"
		name="password"
		type="password"
		autocomplete="new-password"
		error={errors.password?.[0]}
	/>
	<FormField
		label="Confirm password"
		name="confirmPassword"
		type="password"
		autocomplete="new-password"
		error={errors.confirmPassword?.[0]}
	/>

	<Button type="submit" fullWidth disabled={submitting}>
		{submitting ? 'Creating account…' : 'Create account'}
	</Button>

	<p class="footer">
		Already have an account? <a href="/login">Sign in</a>
	</p>
</form>

<style>
	.form {
		width: 100%;
	}

	.banner {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		margin: 0 0 var(--space-md);
		font-size: 0.875rem;
	}

	.banner.error {
		background: #fdeaea;
		color: var(--color-danger);
	}

	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
