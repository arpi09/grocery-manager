<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import TurnstileWidget from '$lib/components/molecules/TurnstileWidget.svelte';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
		email?: string;
		turnstileSiteKey?: string;
	}

	let { errors = {}, message, email = '', turnstileSiteKey = '' }: Props = $props();

	let emailField = $state(email);
	$effect(() => {
		emailField = email;
	});

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
		label="E-post"
		name="email"
		type="email"
		autocomplete="email"
		bind:value={emailField}
		error={errors.email?.[0]}
	/>
	<FormField
		label="Lösenord"
		name="password"
		type="password"
		autocomplete="new-password"
		error={errors.password?.[0]}
	/>
	<FormField
		label="Bekräfta lösenord"
		name="confirmPassword"
		type="password"
		autocomplete="new-password"
		error={errors.confirmPassword?.[0]}
	/>

	{#if turnstileSiteKey}
		<p class="turnstile-label" id="turnstile-label">Bekräfta att du inte är en robot</p>
		<TurnstileWidget siteKey={turnstileSiteKey} labelledBy="turnstile-label" />
	{/if}

	<Button type="submit" fullWidth disabled={submitting}>
		{submitting ? 'Skapar konto…' : 'Skapa konto'}
	</Button>

	<p class="footer">
		Har du konto? <a href="/login">Logga in</a>
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
		background: color-mix(in srgb, var(--color-danger) 12%, var(--color-surface));
		color: var(--color-danger);
	}

	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.turnstile-label {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
