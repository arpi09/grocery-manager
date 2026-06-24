<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/atoms/Button.svelte';
	import { trackProductEvent } from '$lib/client/product-events';
	import { t } from '$lib/i18n';
	import {
		getNotificationPermission,
		isPushSupported,
		pushErrorMessage,
		subscribeToExpiryPush
	} from '$lib/utils/push-notifications';

	interface Props {
		showKivra?: boolean;
	}

	let { showKivra = true }: Props = $props();

	let notificationsDismissed = $state(false);
	let pushSubmitting = $state(false);
	let pushError = $state<string | null>(null);
	let pushEnabled = $state(false);
	let promptedTracked = $state(false);

	const pushSupported = $derived(browser && isPushSupported());
	const pushDenied = $derived(
		browser && getNotificationPermission() === 'denied'
	);
	const showNotificationsCard = $derived(
		pushSupported && !pushEnabled && !notificationsDismissed && !pushDenied
	);

	$effect(() => {
		if (!browser || promptedTracked) {
			return;
		}
		promptedTracked = true;
		void trackProductEvent('onboarding_notifications_prompted');
	});

	$effect(() => {
		if (!browser) {
			return;
		}
		pushEnabled = getNotificationPermission() === 'granted';
	});

	async function enablePush() {
		pushError = null;
		pushSubmitting = true;
		try {
			const result = await subscribeToExpiryPush();
			if (!result.ok) {
				if (result.reason === 'denied') {
					pushEnabled = false;
					return;
				}
				pushError = pushErrorMessage(result.reason);
				return;
			}
			pushEnabled = true;
		} catch {
			pushError = pushErrorMessage('failed');
		} finally {
			pushSubmitting = false;
		}
	}

	function dismissNotifications() {
		notificationsDismissed = true;
	}

	function handleKivraClick() {
		void trackProductEvent('onboarding_kivra_tapped', { surface: 'shopping_setup' });
	}
</script>

<div class="setup-cards" data-testid="activation-setup-cards">
	<p class="setup-heading">{t('onboarding.activation.setup.title')}</p>

	{#if showNotificationsCard}
		<div class="setup-card" data-testid="activation-setup-notifications">
			<p class="setup-card-title">{t('onboarding.activation.setup.notificationsTitle')}</p>
			<p class="setup-card-body">{t('onboarding.activation.setup.notificationsBody')}</p>
			<div class="setup-card-actions">
				<Button
					type="button"
					variant="secondary"
					fullWidth
					disabled={pushSubmitting}
					data-testid="activation-setup-notifications-enable"
					onclick={enablePush}
				>
					{t('onboarding.activation.setup.notificationsCta')}
				</Button>
				<Button
					type="button"
					variant="ghost"
					fullWidth
					data-testid="activation-setup-notifications-later"
					onclick={dismissNotifications}
				>
					{t('onboarding.activation.setup.notificationsLater')}
				</Button>
			</div>
			{#if pushError}
				<p class="setup-error">{pushError}</p>
			{/if}
		</div>
	{/if}

	{#if showKivra}
		<div class="setup-card" data-testid="activation-setup-kivra">
			<p class="setup-card-title">{t('onboarding.activation.setup.kivraTitle')}</p>
			<p class="setup-card-body">{t('onboarding.activation.setup.kivraBody')}</p>
			<a
				class="setup-link"
				href="/settings/kivra"
				data-testid="activation-setup-kivra-link"
				onclick={handleKivraClick}
			>
				{t('onboarding.activation.scan.kivraLink')}
			</a>
		</div>
	{/if}

	<a
		class="setup-all-link"
		href="/settings/notifications"
		data-testid="activation-setup-all-notifications"
	>
		{t('onboarding.activation.setup.allNotificationsLink')}
	</a>
</div>

<style>
	.setup-cards {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.setup-heading {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.setup-card {
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		border: 1px solid var(--color-border);
	}

	@media (max-width: 360px) {
		.setup-card[data-testid='activation-setup-kivra'] {
			display: none;
		}
	}

	.setup-card-title {
		margin: 0;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.setup-card-body {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.setup-card-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
	}

	.setup-error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-danger);
	}

	.setup-link,
	.setup-all-link {
		display: inline-block;
		margin-top: var(--space-sm);
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.setup-link:hover,
	.setup-all-link:hover {
		text-decoration: underline;
	}

	.setup-all-link {
		margin-top: 0;
		font-size: 0.8125rem;
		font-weight: 500;
		align-self: center;
	}
</style>
