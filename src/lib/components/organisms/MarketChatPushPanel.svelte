<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import { t } from '$lib/i18n';
	import {
		isPushSupported,
		subscribeToExpiryPush
	} from '$lib/utils/push-notifications';

	let chatPushEnabled = $state(false);
	let pushNotificationsEnabled = $state(false);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let loaded = $state(false);

	async function loadSettings() {
		try {
			const response = await fetch('/api/market/chat-push-settings');
			const data = (await response.json()) as {
				ok?: boolean;
				enabled?: boolean;
				pushNotificationsEnabled?: boolean;
			};
			if (response.ok && data.ok) {
				chatPushEnabled = Boolean(data.enabled);
				pushNotificationsEnabled = Boolean(data.pushNotificationsEnabled);
			}
		} catch {
			// best-effort
		} finally {
			loaded = true;
		}
	}

	async function toggleChatPush(enabled: boolean) {
		submitting = true;
		errorMessage = null;

		try {
			if (enabled && isPushSupported() && !pushNotificationsEnabled) {
				const subscribed = await subscribeToExpiryPush();
				if (!subscribed.ok) {
					errorMessage = t('marketV01.chatPushRequiresPush');
					return;
				}
				pushNotificationsEnabled = true;
			}

			const response = await fetch('/api/market/chat-push-settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: enabled ? 'true' : 'false' })
			});
			const data = (await response.json()) as { ok?: boolean; error?: string };
			if (!response.ok || !data.ok) {
				errorMessage =
					data.error === 'push_required'
						? t('marketV01.chatPushRequiresPush')
						: t('marketV01.chatPushSaveFailed');
				return;
			}

			chatPushEnabled = enabled;
		} catch {
			errorMessage = t('marketV01.chatPushSaveFailed');
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		void loadSettings();
	});
</script>

{#if loaded}
	<Card class="chat-push-card">
		<div class="copy">
			<h2>{t('marketV01.chatPushTitle')}</h2>
			<p>{t('marketV01.chatPushNote')}</p>
		</div>
		<Toggle
			checked={chatPushEnabled}
			label={t('marketV01.chatPushEnableLabel')}
			disabled={submitting}
			toggleNotify={(enabled) => {
				void toggleChatPush(enabled);
			}}
		/>
		{#if !pushNotificationsEnabled && !chatPushEnabled}
			<p class="hint">{t('marketV01.chatPushRequiresPush')}</p>
		{/if}
		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}
		{#if submitting}
			<p class="hint">{t('common.saving')}</p>
		{/if}
	</Card>
{/if}

<style>
	:global(.chat-push-card) {
		display: grid !important;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0;
		font-size: 1rem;
	}

	p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.hint,
	.error {
		font-size: 0.8125rem;
	}

	.error {
		color: var(--color-danger);
	}
</style>
