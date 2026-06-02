<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import TurnstileWidget from '$lib/components/molecules/TurnstileWidget.svelte';
	import { getRegisterCaptchaUiState } from '$lib/domain/register-captcha-ui';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { t } from '$lib/i18n';

	interface Props {
		errors?: Record<string, string[]>;
		message?: string;
		success?: boolean;
		email?: string;
		turnstileSiteKey?: string;
		captchaRequired?: boolean;
	}

	let {
		errors = {},
		message,
		success = false,
		email = '',
		turnstileSiteKey = '',
		captchaRequired = false
	}: Props = $props();

	const captchaUi = $derived(getRegisterCaptchaUiState(turnstileSiteKey, captchaRequired));

	let emailField = $state(email);
	$effect(() => {
		emailField = email;
	});

	let submitting = $state(false);
	let captchaLoadFailed = $state(false);
</script>

{#if success && message}
	<FeedbackBanner tone="info" message={message} />
	<p class="footer">
		<a href="/login">{t('auth.forgotPassword.backToLogin')}</a>
	</p>
{:else}
	<form
		method="POST"
		class="form"
		use:enhance={bindSubmitting((v) => (submitting = v))}
	>
		{#if captchaUi.showMisconfiguredBanner}
			<FeedbackBanner tone="error" message={t('captcha.notConfigured')} />
		{:else if message}
			<FeedbackBanner tone="error" message={message} />
		{/if}

		<p class="lead">{t('auth.forgotPassword.lead')}</p>

		<FormField
			label={t('auth.email')}
			name="email"
			type="email"
			autocomplete="email"
			bind:value={emailField}
			error={errors.email?.[0]}
		/>

		{#if captchaUi.showWidget}
			<div data-testid="forgot-password-turnstile">
				<p class="turnstile-label" id="forgot-turnstile-label">
					{t('auth.register.captchaLabel')}
				</p>
				<TurnstileWidget
					siteKey={turnstileSiteKey}
					labelledBy="forgot-turnstile-label"
					bind:loadFailed={captchaLoadFailed}
				/>
			</div>
		{/if}

		<Button
			type="submit"
			fullWidth
			loading={submitting}
			loadingLabel={t('auth.forgotPassword.submitting')}
			disabled={captchaUi.disableSubmit || captchaLoadFailed}
		>
			{t('auth.forgotPassword.submit')}
		</Button>

		<p class="footer">
			<a href="/login">{t('auth.forgotPassword.backToLogin')}</a>
		</p>
	</form>
{/if}

<style>
	.form {
		width: 100%;
	}

	.lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.footer {
		margin-top: var(--space-lg);
		text-align: center;
		font-size: 0.875rem;
	}

	.turnstile-label {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
</style>
