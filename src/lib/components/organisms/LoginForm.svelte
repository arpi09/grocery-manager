<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import { bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import { t } from '$lib/i18n';

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
	use:enhance={bindSubmittingWithRedirect(
		(v) => (submitting = v),
		(location) => goto(location, { invalidateAll: true })
	)}
>
	{#if message}
		<FeedbackBanner tone={messageTone === 'info' ? 'info' : 'error'} message={message} />
	{/if}

	{#if redirectTo}
		<input type="hidden" name="redirectTo" value={redirectTo} />
	{/if}

	<FormField
		label={t('auth.email')}
		name="email"
		type="email"
		autocomplete="email"
		bind:value={emailField}
		error={errors.email?.[0]}
	/>
	<FormField
		label={t('auth.password')}
		name="password"
		type="password"
		autocomplete="current-password"
		error={errors.password?.[0]}
	/>

	<Button type="submit" fullWidth disabled={submitting} data-testid="login-submit">
		{submitting ? t('auth.login.submitting') : t('auth.login.submit')}
	</Button>

	<div class="register-block">
		<p class="register-lead">{t('auth.login.newHere')}</p>
		<a href="/register" class="register-cta">
			<span class="register-cta-text">{t('auth.login.createAccount')}</span>
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

	.register-block {
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--color-border);
		text-align: center;
	}

	@media (max-width: 899px) {
		.register-block {
			margin-top: var(--space-md);
			padding-top: var(--space-md);
		}

		.register-cta {
			padding: 0.625rem 1rem;
			font-size: 0.9375rem;
		}
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
		font-weight: 600;
		font-size: var(--font-size-body);
		text-decoration: none;
		color: var(--color-text);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		transition:
			background 0.15s ease,
			border-color 0.15s ease;
	}

	.register-cta:hover {
		text-decoration: none;
		background: color-mix(in srgb, var(--color-surface-muted) 85%, var(--color-border));
		border-color: color-mix(in srgb, var(--color-text-muted) 35%, var(--color-border));
	}

	.register-cta:focus-visible {
		outline: var(--focus-ring-width) solid var(--focus-ring-color);
		outline-offset: var(--focus-ring-offset);
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
		.register-cta-arrow {
			transition: none;
		}
	}
</style>
