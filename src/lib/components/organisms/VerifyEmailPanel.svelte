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

<form method="POST" action="?/resend">
	{#if success}
		<FeedbackBanner tone="success" message={t('auth.verifyEmail.resendSuccess')} />
	{/if}
	<Button type="submit" variant="secondary">{t('auth.verifyEmail.resend')}</Button>
</form>

<style>
	.email {
		margin: 0 0 var(--space-sm);
		font-weight: 600;
		word-break: break-word;
	}
	.lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted, var(--text-muted));
		line-height: 1.5;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
</style>
