<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		email?: string | null;
		success?: boolean;
	}

	let { email = null, success = false }: Props = $props();
</script>

{#if email}
	<p class="email" aria-live="polite">{email}</p>
{/if}

<p class="lead">{t('auth.verifyEmail.lead')}</p>
<p class="legacy-note">{t('auth.verifyEmail.legacyNotice')}</p>

<form method="POST" action="?/resend" class="resend-form">
	{#if success}
		<FeedbackBanner tone="success" message={t('auth.verifyEmail.resendSuccess')} />
	{/if}
	<Button type="submit" variant="primary">{t('auth.verifyEmail.resend')}</Button>
</form>

<nav class="footer-nav" aria-label={t('auth.verifyEmail.footerNavAria')}>
	<a href="/">{t('auth.verifyEmail.backHome')}</a>
	<form method="POST" action="/logout" class="logout-form">
		<button type="submit">{t('nav.logout')}</button>
	</form>
	<a href="/login">{t('auth.verifyEmail.switchAccount')}</a>
</nav>

<style>
	.email {
		margin: 0 0 var(--space-sm);
		font-weight: 600;
		word-break: break-word;
	}
	.lead {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted, var(--text-muted));
		line-height: 1.5;
	}
	.legacy-note {
		margin: 0 0 var(--space-md);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-primary) 8%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, var(--color-border));
		font-size: 0.875rem;
		line-height: 1.45;
		color: var(--color-text);
	}
	.resend-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}
	.footer-nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-sm) var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--color-border);
		font-size: 0.875rem;
	}
	.footer-nav a,
	.logout-form button {
		color: var(--color-text-muted);
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		cursor: pointer;
	}
	.footer-nav a:hover,
	.logout-form button:hover {
		color: var(--color-primary);
		text-decoration: underline;
	}
</style>
