<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import TurnstileWidget from '$lib/components/molecules/TurnstileWidget.svelte';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { t } from '$lib/i18n';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
		email?: string;
		turnstileSiteKey?: string;
		/** True when Turnstile is required (not CI/local bypass). */
		captchaRequired?: boolean;
	}

	let {
		errors = {},
		message,
		email = '',
		turnstileSiteKey = '',
		captchaRequired = false
	}: Props = $props();

	const captchaMisconfigured = $derived(captchaRequired && !turnstileSiteKey);

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
	use:enhance={bindSubmitting((v) => (submitting = v))}
>
	{#if captchaMisconfigured}
		<FeedbackBanner tone="error" message={t('captcha.notConfigured')} />
	{:else if message}
		<FeedbackBanner tone="error" message={message} />
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
		autocomplete="new-password"
		error={errors.password?.[0]}
	/>
	<FormField
		label={t('auth.confirmPassword')}
		name="confirmPassword"
		type="password"
		autocomplete="new-password"
		error={errors.confirmPassword?.[0]}
	/>

	{#if turnstileSiteKey}
		<div data-testid="register-turnstile">
			<p class="turnstile-label" id="turnstile-label">{t('auth.register.captchaLabel')}</p>
			<TurnstileWidget siteKey={turnstileSiteKey} labelledBy="turnstile-label" />
		</div>
	{/if}

	<Button
		type="submit"
		fullWidth
		loading={submitting}
		loadingLabel={t('auth.register.submitting')}
		disabled={captchaMisconfigured}
		data-testid="register-submit"
	>
		{t('auth.register.submit')}
	</Button>

	<p class="footer">
		{t('auth.register.hasAccount')} <a href="/login">{t('auth.register.loginLink')}</a>
	</p>
</form>

<style>
	.form {
		width: 100%;
	}

	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	@media (max-width: 899px) {
		.footer {
			margin-top: var(--space-md);
			font-size: 0.8125rem;
		}

		.turnstile-label {
			margin-bottom: var(--space-xs);
			font-size: 0.8125rem;
		}
	}

	.turnstile-label {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
