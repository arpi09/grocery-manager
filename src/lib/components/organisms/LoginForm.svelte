<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
		messageTone?: 'error' | 'info';
		email?: string;
	}

	let { errors = {}, message, messageTone = 'error', email = '' }: Props = $props();

	let submitting = $state(false);
</script>

<form
	method="POST"
	action="?/login"
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
		<p class="banner {messageTone}" role="alert">{message}</p>
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
		autocomplete="current-password"
		error={errors.password?.[0]}
	/>

	<Button type="submit" fullWidth disabled={submitting}>
		{submitting ? 'Signing in…' : 'Sign in'}
	</Button>

	<p class="hint">First time here? <a href="/register">Create an account</a> before signing in.</p>

	<p class="footer">
		No account? <a href="/register">Register</a>
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

	.banner.info {
		background: #e8f5e9;
		color: #1b5e20;
	}

	.hint {
		margin: var(--space-md) 0 0;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-sm);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-align: center;
	}

	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
