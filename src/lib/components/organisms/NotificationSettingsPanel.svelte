<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import SkaffuSettingsToggleRow from '$lib/components/molecules/SkaffuSettingsToggleRow.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { getLocale, t, type MessageKey } from '$lib/i18n';
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
		getNotificationPermission,
		isPushSupported,
		isPushServiceWorkerAvailable,
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
		shoppingPushError?: string | null;
	}

	let {
		expiryRemindersEnabled: initialExpiryEnabled,
		expiryReminderDays: initialExpiryDays,
		autoExpiredGraceDays,
		pushNotificationsEnabled: initialPushEnabled,
		shoppingPushEnabled: initialShoppingPushEnabled,
		shoppingToPantryMode: initialShoppingToPantryMode = 'ask',
		shoppingPushError = null
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
	let pushReady = $state(false);
	let pushReadyChecked = $state(false);
	let pushPermissionDenied = $state(false);
	let pushPermissionRecovered = $state(false);
	let expiryRemindersForm: HTMLFormElement | undefined = $state();
	let autoExpiredGraceForm: HTMLFormElement | undefined = $state();
	let shoppingPushForm: HTMLFormElement | undefined = $state();
	let shoppingToPantryMode = $state<ShoppingToPantryMode>(initialShoppingToPantryMode);
	let shoppingToPantrySubmitting = $state(false);
	let shoppingToPantryForm: HTMLFormElement | undefined = $state();

	const pushDrift = $derived(
		browser && initialPushEnabled && pushPermissionDenied && !pushNotificationsSubmitting
	);

	const pushRequiresInstall = $derived(
		browser && pushReadyChecked && pushSupported && !pushReady && !pushPermissionDenied
	);

	const pushStatusKey = $derived.by((): MessageKey | null => {
		if (!pushSupported) {
			return 'settings.pushNotifications.status.requiresInstall';
		}
		if (pushPermissionDenied) {
			return 'settings.pushNotifications.status.permissionDenied';
		}
		if (!pushReadyChecked) {
			return null;
		}
		if (!pushReady) {
			return 'settings.pushNotifications.status.requiresInstall';
		}
		if (pushNotificationsEnabled) {
			return 'settings.pushNotifications.status.enabled';
		}
		return 'settings.pushNotifications.status.disabled';
	});

	const shoppingPushDisabled = $derived(
		shoppingPushSubmitting ||
			(!shoppingPushEnabled &&
				(!pushReady || !pushNotificationsEnabled || pushPermissionDenied))
	);

	const shoppingPushErrorMessage = $derived(
		shoppingPushError === 'push_required' ? t('settings.shoppingPush.errors.pushRequired') : null
	);

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

	function recheckPushPermission() {
		if (!browser) {
			return;
		}

		const permission = getNotificationPermission();
		if (permission === null) {
			pushPermissionDenied = false;
			pushPermissionRecovered = false;
			return;
		}
		if (pushPermissionDenied && permission !== 'denied') {
			pushPermissionDenied = false;
			pushNotificationsError = null;
			if (permission === 'granted') {
				pushPermissionRecovered = true;
			}
			return;
		}

		pushPermissionDenied = permission === 'denied';
		if (permission === 'denied') {
			pushPermissionRecovered = false;
		}
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		pushSupported = isPushSupported();
		recheckPushPermission();

		void (async () => {
			pushReady = await isPushServiceWorkerAvailable();
			pushReadyChecked = true;
		})();
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		const onRecheck = () => recheckPushPermission();
		window.addEventListener('focus', onRecheck);
		document.addEventListener('visibilitychange', onRecheck);

		return () => {
			window.removeEventListener('focus', onRecheck);
			document.removeEventListener('visibilitychange', onRecheck);
		};
	});

	$effect(() => {
		if (!browser || !pushSupported || pushNotificationsSubmitting || initialPushEnabled) {
			return;
		}

		void (async () => {
			if (getNotificationPermission() !== 'granted') {
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
					pushNotificationsEnabled = false;
					if (result.reason === 'denied') {
						pushPermissionDenied = true;
						pushPermissionRecovered = false;
						pushNotificationsError = null;
					} else {
						pushNotificationsError = pushErrorMessage(result.reason);
					}
					return;
				}
				pushNotificationsEnabled = true;
				pushPermissionDenied = false;
				pushPermissionRecovered = false;
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

	async function resolvePushDrift() {
		await togglePushNotifications(false);
	}
</script>

<SettingsSection
	id="settings-notifications"
	title={t('settings.notifications.title')}
	description={t('settings.notifications.description')}
>
	<SkaffuSettingsToggleRow
		title={t('settings.expiryReminders.title')}
		note={t('settings.expiryReminders.note')}
		last={false}
	>
		{#snippet control()}
			<Toggle
				checked={expiryRemindersEnabled}
				label={t('settings.expiryReminders.enable')}
				toggleNotify={(enabled) => {
					expiryRemindersEnabled = enabled;
					expiryRemindersForm?.requestSubmit();
				}}
			/>
		{/snippet}
		{#snippet below()}
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
		{/snippet}
	</SkaffuSettingsToggleRow>

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

	<SkaffuSettingsToggleRow
		title={t('settings.pushNotifications.title')}
		note={t('settings.pushNotifications.note')}
		last={false}
	>
		{#snippet control()}
			<Toggle
				checked={pushNotificationsEnabled}
				disabled={!pushReady || pushPermissionDenied || pushNotificationsSubmitting}
				label={t('settings.pushNotifications.enable')}
				toggleNotify={(enabled) => {
					void togglePushNotifications(enabled);
				}}
			/>
		{/snippet}
		{#snippet below()}
			<div class="push-notifications-control">
				{#if pushStatusKey}
					<p class="push-status" role="status">{t(pushStatusKey)}</p>
				{/if}
				{#if pushPermissionDenied}
					<div class="push-help" data-testid="push-permission-denied-help">
						<p class="push-help-intro">{t('settings.pushNotifications.permissionDeniedHelp.intro')}</p>
						<ul class="push-help-steps">
							<li>{t('settings.pushNotifications.permissionDeniedHelp.chrome')}</li>
							<li>{t('settings.pushNotifications.permissionDeniedHelp.safari')}</li>
						</ul>
					</div>
				{/if}
				{#if pushRequiresInstall}
					<a class="text-action push-install-link" href="/install-app">
						{t('settings.pushNotifications.installAppLink')}
					</a>
				{/if}
				{#if pushPermissionRecovered && pushReady && !pushNotificationsEnabled}
					<div class="push-recovered">
						<p class="push-hint">{t('settings.pushNotifications.permissionRecovered')}</p>
						<button
							type="button"
							class="text-action"
							disabled={pushNotificationsSubmitting}
							onclick={() => void togglePushNotifications(true)}
						>
							{t('settings.pushNotifications.permissionRecoveredAction')}
						</button>
					</div>
				{/if}
				{#if pushDrift}
					<div class="push-drift" role="alert">
						<p class="push-drift-copy">{t('settings.pushNotifications.driftWarning')}</p>
						<button type="button" class="text-action" onclick={() => void resolvePushDrift()}>
							{t('settings.pushNotifications.driftDisable')}
						</button>
					</div>
				{/if}
				{#if pushNotificationsSubmitting}
					<span class="expiry-saving">{t('common.saving')}</span>
				{/if}
				{#if pushNotificationsError && !pushPermissionDenied}
					<p class="push-error" role="alert">{pushNotificationsError}</p>
				{/if}
			</div>
		{/snippet}
	</SkaffuSettingsToggleRow>

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

	<SkaffuSettingsToggleRow
		title={t('settings.shoppingPush.title')}
		note={t('settings.shoppingPush.note')}
		last
	>
		{#snippet control()}
			<Toggle
				checked={shoppingPushEnabled}
				disabled={shoppingPushDisabled}
				label={t('settings.shoppingPush.enable')}
				toggleNotify={(enabled) => {
					if (enabled && !pushNotificationsEnabled) {
						return;
					}
					shoppingPushEnabled = enabled;
					shoppingPushForm?.requestSubmit();
				}}
			/>
		{/snippet}
		{#snippet below()}
			<form
				method="POST"
				action="?/updateShoppingPush"
				bind:this={shoppingPushForm}
				use:enhance={bindSubmittingWithRedirect(
					(v) => (shoppingPushSubmitting = v),
					async (location) => {
						const url = new URL(location, 'http://local');
						const kind = parseActionToastKind(url.searchParams.get(ACTION_TOAST_PARAM));
						if (kind === 'settingsSaved') {
							showClientToast(actionToastMessage(getLocale(), kind), { variant: 'success' });
						}
					},
					(formData) => formData.set('enabled', shoppingPushEnabled ? 'true' : 'false')
				)}
			>
				<input type="hidden" name="enabled" value={shoppingPushEnabled ? 'true' : 'false'} />
				{#if !pushNotificationsEnabled && !shoppingPushEnabled}
					<p class="push-hint">
						{pushPermissionDenied
							? t('settings.shoppingPush.requiresPermission')
							: t('settings.shoppingPush.requiresPush')}
					</p>
				{/if}
				{#if shoppingPushErrorMessage}
					<p class="push-error" role="alert">{shoppingPushErrorMessage}</p>
				{/if}
				{#if shoppingPushSubmitting}
					<span class="expiry-saving">{t('common.saving')}</span>
				{/if}
			</form>
		{/snippet}
	</SkaffuSettingsToggleRow>
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
		color-scheme: light dark;
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

	.push-status {
		margin: 0;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.push-drift {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
		background: color-mix(in srgb, var(--color-warning) 8%, var(--color-surface));
	}

	.push-drift-copy {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.push-help {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
		background: var(--color-surface-muted);
	}

	.push-help-intro {
		margin: 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.push-help-steps {
		margin: 0;
		padding-left: 1.15rem;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.push-help-steps li + li {
		margin-top: 0.25rem;
	}

	.push-install-link {
		font-size: 0.85rem;
	}

	.push-recovered {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
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
		color: var(--color-danger);
	}
</style>
