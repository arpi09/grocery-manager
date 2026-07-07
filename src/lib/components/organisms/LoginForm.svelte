<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import GoogleSignInButton from '$lib/components/molecules/GoogleSignInButton.svelte';
	import { t } from '$lib/i18n';
	import type { SubmitFunction } from '@sveltejs/kit';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
		messageTone?: 'error' | 'info';
		email?: string;
		redirectTo?: string;
		googleOAuthEnabled?: boolean;
	}

	let {
		errors = {},
		message,
		messageTone = 'error',
		email = '',
		redirectTo,
		googleOAuthEnabled = false
	}: Props = $props();

	const googleHref = $derived(
		redirectTo ? `/auth/google?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/google'
	);

	const LAST_EMAIL_KEY = 'skaffu:lastLoginEmail';

	let emailField = $state(email);
	$effect(() => {
		emailField = email;
	});

	// Prefill last-used email for returning users (only when server gave none).
	$effect(() => {
		if (!emailField) {
			try {
				const saved = localStorage.getItem(LAST_EMAIL_KEY);
				if (saved) emailField = saved;
			} catch {
				// localStorage unavailable (private mode) — skip prefill.
			}
		}
	});

	let submitting = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

	/** After a failed submit: move focus to the first invalid field, else the banner. */
	function focusFirstProblem() {
		requestAnimationFrame(() => {
			const target =
				formEl?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
				formEl?.querySelector<HTMLElement>('[data-feedback-banner]');
			target?.focus();
		});
	}

	const submitLogin: SubmitFunction = (input) => {
		const submittedEmail = String(input.formData.get('email') ?? '');
		const inner = bindSubmitting((v) => (submitting = v))(input);
		return async (opts) => {
			if (opts.result.type === 'redirect' && submittedEmail) {
				try {
					localStorage.setItem(LAST_EMAIL_KEY, submittedEmail);
				} catch {
					// Private mode — fine without remembering.
				}
			}
			await inner?.(opts);
			if (opts.result.type === 'failure') {
				focusFirstProblem();
			}
		};
	};
</script>

<form method="POST" action="?/login" class="form" bind:this={formEl} use:enhance={submitLogin}>
	{#if message}
		<div data-feedback-banner tabindex="-1" class="banner-focus-wrap">
			<FeedbackBanner tone={messageTone} {message} />
		</div>
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
		revealable
		error={errors.password?.[0]}
	/>

	<p class="forgot-row">
		<a href="/forgot-password">{t('auth.login.forgotPassword')}</a>
	</p>

	<Button type="submit" fullWidth disabled={submitting} data-testid="login-submit">
		{submitting ? t('auth.login.submitting') : t('auth.login.submit')}
	</Button>

	{#if googleOAuthEnabled}
		<div class="oauth-divider" aria-hidden="true">{t('auth.google.or')}</div>
		<GoogleSignInButton href={googleHref} />
	{/if}

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

	.banner-focus-wrap:focus {
		outline: none;
	}

	.forgot-row {
		margin: calc(-1 * var(--space-xs)) 0 var(--space-md);
		text-align: right;
		font-size: 0.85rem;
	}

	.oauth-divider {
		margin: var(--space-md) 0;
		text-align: center;
		font-size: 0.8rem;
		color: var(--color-text-muted);
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
