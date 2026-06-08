<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { getLocale, t } from '$lib/i18n';
	import {
		ACTION_TOAST_PARAM,
		actionToastMessage,
		parseActionToastKind
	} from '$lib/utils/action-toast';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import {
		SHOPPING_TO_PANTRY_MODES,
		type ShoppingToPantryMode
	} from '$lib/domain/shopping-to-pantry';
	import { bindSubmitting, bindSubmittingWithRedirect } from '$lib/utils/form-submit-feedback';
	import {
		isPushSupported,
		pushErrorMessage,
		resyncExistingPushSubscription,
		subscribeToExpiryPush,
		unsubscribeFromExpiryPush
	} from '$lib/utils/push-notifications';

	interface Props {
		expiryRemindersEnabled: boolean;
		expiryReminderDays: number;
		autoExpiredGraceDays: number | null;
		pushNotificationsEnabled: boolean;
		shoppingPushEnabled: boolean;
		shoppingToPantryMode?: ShoppingToPantryMode;
	}

	let {
		expiryRemindersEnabled: initialExpiryEnabled,
		expiryReminderDays: initialExpiryDays,
		autoExpiredGraceDays,
		pushNotificationsEnabled: initialPushEnabled,
		shoppingPushEnabled: initialShoppingPushEnabled,
		shoppingToPantryMode: initialShoppingToPantryMode = 'ask'
	}: Props = $props();

	let expiryRemindersEnabled = $state(initialExpiryEnabled);
	let expiryReminderDays = $state(String(initialExpiryDays));
	let autoExpiredGraceDaysLocal = $state(
		autoExpiredGraceDays !== null ? String(autoExpiredGraceDays) : '7'
	);
	let pushNotificationsEnabled = $state(initialPushEnabled);
	let shoppingPushEnabled = $state(initialShoppingPushEnabled);
	let expiryRemindersSubmitting = $state(false);
	let autoExpiredGraceSubmitting = $state(false);
	let pushNotificationsSubmitting = $state(false);
	let pushNotificationsError = $state<string | null>(null);
	let shoppingPushSubmitting = $state(false);
	let pushSupported = $state(false);
	let expiryRemindersForm: HTMLFormElement | undefined = $state();
	let autoExpiredGraceForm: HTMLFormElement | undefined = $state();
	let shoppingPushForm: HTMLFormElement | undefined = $state();
	let shoppingToPantryMode = $state<ShoppingToPantryMode>(initialShoppingToPantryMode);
	let shoppingToPantrySubmitting = $state(false);
	let shoppingToPantryForm: HTMLFormElement | undefined = $state();

	$effect(() => {
		expiryRemindersEnabled = initialExpiryEnabled;
		expiryReminderDays = String(initialExpiryDays);
		if (autoExpiredGraceDays !== null) {
			autoExpiredGraceDaysLocal = String(autoExpiredGraceDays);
		}
		if (!pushNotificationsSubmitting) {
			pushNotificationsEnabled = initialPushEnabled;
		}
		shoppingPushEnabled = initialShoppingPushEnabled;
		shoppingToPantryMode = initialShoppingToPantryMode;
	});

	$effect(() => {
		if (browser) {
			pushSupported = isPushSupported();
			if (pushSupported) {
				void import('virtual:pwa-register').then(({ registerSW }) => {
					registerSW({ immediate: true });
				});
			}
		}
	});

	$effect(() => {
		if (!browser || !pushSupported || pushNotificationsSubmitting || initialPushEnabled) {
			return;
		}

		void (async () => {
			if (Notification.permission !== 'granted') {
				return;
			}

			const result = await resyncExistingPushSubscription();
			if (result.ok) {
				await invalidateAll();
			}
		})();
	});

	async function togglePushNotifications(enabled: boolean) {
		pushNotificationsError = null;
		pushNotificationsSubmitting = true;
		try {
			if (enabled) {
				const result = await subscribeToExpiryPush();
				if (!result.ok) {
					pushNotificationsError = pushErrorMessage(result.reason);
					pushNotificationsEnabled = false;
					return;
				}
				pushNotificationsEnabled = true;
				showClientToast(t('actionToast.pushEnabled'), { variant: 'success' });
				await invalidateAll();
			} else {
				const result = await unsubscribeFromExpiryPush();
				if (!result.ok) {
					pushNotificationsError = pushErrorMessage(result.reason);
					pushNotificationsEnabled = initialPushEnabled;
					return;
				}
				pushNotificationsEnabled = false;
				showClientToast(t('actionToast.pushDisabled'), { variant: 'success' });
				await invalidateAll();
			}
		} catch {
			pushNotificationsError = pushErrorMessage('failed');
			pushNotificationsEnabled = false;
		} finally {
			pushNotificationsSubmitting = false;
		}
	}
</script>

<SettingsSection
	id="settings-notifications"
	title={t('settings.notifications.title')}
	description={t('settings.notifications.description')}
>
	<SettingsRow
		title={t('settings.expiryReminders.title')}
		note={t('settings.expiryReminders.note')}
		last={false}
	>
		<form
			method="POST"
			action="?/updateExpiryReminders"
			class="expiry-reminders-form"
			bind:this={expiryRemindersForm}
			use:enhance={bindSubmittingWithRedirect(
				(v) => (expiryRemindersSubmitting = v),
				async (location) => {
					const url = new URL(location, 'http://local');
					const kind = parseActionToastKind(url.searchParams.get(ACTION_TOAST_PARAM));
					if (kind === 'settingsSaved') {
						showClientToast(actionToastMessage(getLocale(), kind), { variant: 'success' });
					}
				},
				(formData) => {
					formData.set('enabled', expiryRemindersEnabled ? 'true' : 'false');
					formData.set('days', expiryReminderDays);
				}
			)}
		>
			<input type="hidden" name="enabled" value={expiryRemindersEnabled ? 'true' : 'false'} />
			<Toggle
				checked={expiryRemindersEnabled}
				label={t('settings.expiryReminders.enable')}
				onchange={(enabled) => {
					expiryRemindersEnabled = enabled;
					expiryRemindersForm?.requestSubmit();
				}}
			/>
			<label class="expiry-days">
				<span>{t('settings.expiryReminders.daysLabel')}</span>
				<select
					name="days"
					disabled={!expiryRemindersEnabled}
					bind:value={expiryReminderDays}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					<option value="3">{t('settings.expiryReminders.daysOption', { days: 3 })}</option>
					<option value="7">{t('settings.expiryReminders.daysOption', { days: 7 })}</option>
				</select>
			</label>
			{#if expiryRemindersSubmitting}
				<span class="expiry-saving">{t('common.saving')}</span>
			{/if}
		</form>
	</SettingsRow>

	{#if autoExpiredGraceDays != null}
		<SettingsRow
			title={t('settings.autoExpiredGrace.title')}
			note={t('settings.autoExpiredGrace.note')}
			last={false}
		>
			<p class="grace-timeline">
				{t('settings.autoExpiredGrace.timeline', { days: autoExpiredGraceDaysLocal })}
			</p>
			<form
				method="POST"
				action="?/updateAutoExpiredGrace"
				class="expiry-reminders-form"
				bind:this={autoExpiredGraceForm}
				use:enhance={bindSubmitting((v) => (autoExpiredGraceSubmitting = v))}
			>
				<label class="expiry-days">
					<span>{t('settings.autoExpiredGrace.daysLabel')}</span>
					<select
						name="days"
						bind:value={autoExpiredGraceDaysLocal}
						onchange={(event) => event.currentTarget.form?.requestSubmit()}
					>
						<option value="3">{t('settings.autoExpiredGrace.daysOption', { days: 3 })}</option>
						<option value="7">{t('settings.autoExpiredGrace.daysOption', { days: 7 })}</option>
						<option value="14">{t('settings.autoExpiredGrace.daysOption', { days: 14 })}</option>
					</select>
				</label>
				{#if autoExpiredGraceSubmitting}
					<span class="expiry-saving">{t('common.saving')}</span>
				{/if}
			</form>
		</SettingsRow>
	{/if}

	<SettingsRow
		title={t('settings.pushNotifications.title')}
		note={t('settings.pushNotifications.note')}
		last={false}
	>
		<div class="push-notifications-control">
			<Toggle
				checked={pushNotificationsEnabled}
				disabled={!pushSupported || pushNotificationsSubmitting}
				label={t('settings.pushNotifications.enable')}
				onchange={(enabled) => {
					void togglePushNotifications(enabled);
				}}
			/>
			{#if !pushSupported}
				<p class="push-hint">{t('settings.pushNotifications.unsupported')}</p>
			{/if}
			{#if pushNotificationsSubmitting}
				<span class="expiry-saving">{t('common.saving')}</span>
			{/if}
			{#if pushNotificationsError}
				<p class="push-error" role="alert">{pushNotificationsError}</p>
			{/if}
		</div>
	</SettingsRow>

	<SettingsRow
		title={t('settings.shoppingToPantry.title')}
		note={t('settings.shoppingToPantry.note')}
		last={false}
	>
		<form
			method="POST"
			action="?/updateShoppingToPantryMode"
			bind:this={shoppingToPantryForm}
			use:enhance={bindSubmitting((v) => (shoppingToPantrySubmitting = v))}
		>
			<label class="expiry-days">
				<span>{t('settings.shoppingToPantry.modeLabel')}</span>
				<select
					name="shoppingToPantryMode"
					bind:value={shoppingToPantryMode}
					onchange={(event) => event.currentTarget.form?.requestSubmit()}
				>
					{#each SHOPPING_TO_PANTRY_MODES as mode (mode)}
						<option value={mode}>{t(`shopping.pantryBridge.mode.${mode}`)}</option>
					{/each}
				</select>
			</label>
			{#if shoppingToPantrySubmitting}
				<span class="expiry-saving">{t('common.saving')}</span>
			{/if}
		</form>
	</SettingsRow>

	<SettingsRow
		title={t('settings.shoppingPush.title')}
		note={t('settings.shoppingPush.note')}
		last
	>
		<form
			method="POST"
			action="?/updateShoppingPush"
			bind:this={shoppingPushForm}
			use:enhance={bindSubmitting(
				(v) => (shoppingPushSubmitting = v),
				(formData) => formData.set('enabled', shoppingPushEnabled ? 'true' : 'false')
			)}
		>
			<input type="hidden" name="enabled" value={shoppingPushEnabled ? 'true' : 'false'} />
			<Toggle
				checked={shoppingPushEnabled}
				disabled={
					shoppingPushSubmitting ||
					!pushSupported ||
					(!pushNotificationsEnabled && !shoppingPushEnabled)
				}
				label={t('settings.shoppingPush.enable')}
				onchange={(enabled) => {
					if (enabled && !pushNotificationsEnabled) {
						return;
					}
					shoppingPushEnabled = enabled;
					shoppingPushForm?.requestSubmit();
				}}
			/>
			{#if pushSupported && !pushNotificationsEnabled}
				<p class="push-hint">{t('settings.shoppingPush.requiresPush')}</p>
			{/if}
			{#if shoppingPushSubmitting}
				<span class="expiry-saving">{t('common.saving')}</span>
			{/if}
		</form>
	</SettingsRow>
</SettingsSection>

<style>
	.grace-timeline {
		margin: 0 0 var(--space-sm);
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.expiry-reminders-form {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-sm);
		min-width: min(100%, 240px);
	}

	.expiry-days {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
		width: 100%;
	}

	.expiry-days select {
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
	}

	.expiry-days select:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.expiry-saving {
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.push-notifications-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.push-hint,
	.push-error {
		margin: 0;
		font-size: 0.85rem;
	}

	.push-hint {
		color: var(--color-text-muted);
	}

	.push-error {
		color: var(--color-danger, #b42318);
	}
</style>
