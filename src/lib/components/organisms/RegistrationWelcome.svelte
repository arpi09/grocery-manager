<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { t } from '$lib/i18n';
	import { REGISTRATION_WELCOME_DONE_EVENT } from '$lib/utils/onboarding';

	const userId = $derived(page.data.user?.id ?? null);
	const shownKey = $derived(userId ? `home-pantry-registration-welcome-shown:${userId}` : null);

	let visible = $state(false);

	$effect(() => {
		if (!browser || !shownKey) {
			visible = false;
			return;
		}
		visible = localStorage.getItem(shownKey) !== '1';
	});

	function dismiss() {
		if (!shownKey) return;
		localStorage.setItem(shownKey, '1');
		visible = false;
		if (typeof window !== 'undefined') {
			window.dispatchEvent(new Event(REGISTRATION_WELCOME_DONE_EVENT));
		}
	}
</script>

{#if visible}
	<div class="welcome" role="status">
		<h2>{t('auth.verifyEmail.welcomeTitle')}</h2>
		<p>{t('auth.verifyEmail.welcomeBody')}</p>
		<button type="button" class="dismiss" onclick={dismiss}>{t('common.close')}</button>
	</div>
{/if}

<style>
	.welcome {
		margin-bottom: var(--space-lg);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-elevated, var(--surface-2));
		border: 1px solid var(--color-border, var(--border));
	}
	.welcome h2 {
		margin: 0 0 var(--space-xs);
		font-size: 1.125rem;
	}
	.welcome p {
		margin: 0 0 var(--space-sm);
		color: var(--color-text-muted, var(--text-muted));
	}
	.dismiss {
		font-size: 0.875rem;
		text-decoration: underline;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}
</style>
