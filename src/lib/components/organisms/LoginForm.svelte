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
		redirectTo?: string;
	}

	let { errors = {}, message, messageTone = 'error', email = '', redirectTo }: Props = $props();

	let emailField = $state(email);
	$effect(() => {
		emailField = email;
	});

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

	{#if redirectTo}
		<input type="hidden" name="redirectTo" value={redirectTo} />
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
		autocomplete="current-password"
		error={errors.password?.[0]}
	/>

	<Button type="submit" fullWidth disabled={submitting}>
		{submitting ? 'Loggar in…' : 'Logga in'}
	</Button>

	<div class="register-block">
		<p class="register-lead">Ny här?</p>
		<a href="/register" class="register-cta">
			<span class="register-cta-text">Skapa konto</span>
			<svg class="register-cta-arrow" viewBox="0 0 20 20" aria-hidden="true">
				<path d="M5 10h10M11 6l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
			</svg>
		</a>
	</div>
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

	.banner.info {
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface));
		color: var(--color-primary);
	}

	.register-block {
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	.register-lead {
		margin: 0 0 var(--space-sm);
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.register-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		width: 100%;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 1rem;
		text-decoration: none;
		color: var(--color-text);
		background: linear-gradient(
			135deg,
			color-mix(in srgb, var(--color-accent) 28%, var(--color-surface-muted)) 0%,
			var(--color-surface-muted) 55%,
			color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-muted)) 100%
		);
		border: 1px solid color-mix(in srgb, var(--color-accent) 45%, var(--color-border));
		box-shadow: var(--shadow-sm);
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease,
			border-color 0.15s ease;
	}

	.register-cta:hover {
		text-decoration: none;
		border-color: var(--color-accent);
		box-shadow: var(--shadow-md);
		transform: translateY(-1px);
	}

	.register-cta:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.register-cta-arrow {
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.register-cta:hover .register-cta-arrow {
		transform: translateX(2px);
	}

	@media (prefers-reduced-motion: reduce) {
		.register-cta,
		.register-cta-arrow {
			transition: none;
		}

		.register-cta:hover {
			transform: none;
		}
	}
</style>
