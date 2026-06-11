<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { t } from '$lib/i18n';
	import {
		queryGeolocationPermission,
		refineGeolocationErrorCode,
		startBrowserLocationRequest,
		type BrowserGeolocationErrorCode
	} from '$lib/utils/browser-geolocation';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		nearbySharingEnabled: boolean;
		nearbyPushEnabled: boolean;
		pushNotificationsEnabled: boolean;
	}

	let {
		nearbySharingEnabled: initialEnabled,
		nearbyPushEnabled: initialNearbyPushEnabled,
		pushNotificationsEnabled: initialPushEnabled
	}: Props = $props();

	let nearbySharingEnabled = $state(initialEnabled);
	let nearbyPushEnabled = $state(initialNearbyPushEnabled);
	let pushNotificationsEnabled = $state(initialPushEnabled);
	let submitting = $state(false);
	let locating = $state(false);
	let nearbyPushSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let nearbyPushError = $state<string | null>(null);
	let prevInitialEnabled = $state(initialEnabled);
	let prevInitialNearbyPushEnabled = $state(initialNearbyPushEnabled);

	const nearbyBusy = $derived(submitting || locating);
	const nearbyToggleChecked = $derived(locating ? true : nearbySharingEnabled);
	const nearbyPushDisabled = $derived(
		nearbyPushSubmitting ||
			nearbyBusy ||
			(!nearbyPushEnabled &&
				(!nearbySharingEnabled || !pushNotificationsEnabled))
	);

	// Sync from server only when load data changes — not when busy flags flip (avoids
	// resetting the toggle after save before invalidateAll() updates props).
	$effect(() => {
		if (initialEnabled !== prevInitialEnabled) {
			prevInitialEnabled = initialEnabled;
			if (!locating) {
				nearbySharingEnabled = initialEnabled;
			}
		}
	});

	$effect(() => {
		if (initialNearbyPushEnabled !== prevInitialNearbyPushEnabled) {
			prevInitialNearbyPushEnabled = initialNearbyPushEnabled;
			if (!nearbyPushSubmitting) {
				nearbyPushEnabled = initialNearbyPushEnabled;
			}
		}
	});

	$effect(() => {
		pushNotificationsEnabled = initialPushEnabled;
	});

	function locationErrorMessage(code: BrowserGeolocationErrorCode): string {
		switch (code) {
			case 'denied':
				return t('nearbySharing.locationDenied');
			case 'blocked':
				return t('nearbySharing.locationBlocked');
			case 'timeout':
				return t('nearbySharing.locationTimeout');
			case 'unavailable':
				return t('nearbySharing.locationUnavailable');
			default:
				return t('nearbySharing.locationRequired');
		}
	}

	async function resolveLocationError(
		code: BrowserGeolocationErrorCode
	): Promise<string> {
		const permission = await queryGeolocationPermission();
		return locationErrorMessage(refineGeolocationErrorCode(code, permission));
	}

	async function persistSettings(enabled: boolean, coords?: { latitude: number; longitude: number }) {
		submitting = true;
		errorMessage = null;
		try {
			const response = await fetch('/api/expiring-share/nearby-settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					enabled,
					latitude: coords?.latitude,
					longitude: coords?.longitude
				})
			});
			const data = (await response.json()) as { ok?: boolean; error?: string; enabled?: boolean };
			if (!response.ok || !data.ok) {
				errorMessage = data.error ?? t('nearbySharing.saveFailed');
				nearbySharingEnabled = initialEnabled;
				return;
			}
			nearbySharingEnabled = Boolean(data.enabled);
			prevInitialEnabled = nearbySharingEnabled;
			if (!nearbySharingEnabled && nearbyPushEnabled) {
				await persistNearbyPush(false);
			}
			await invalidateAll();
			showClientToast(t('actionToast.settingsSaved'), { variant: 'success' });
		} catch {
			errorMessage = t('nearbySharing.saveFailed');
			nearbySharingEnabled = initialEnabled;
		} finally {
			submitting = false;
		}
	}

	async function persistNearbyPush(enabled: boolean) {
		nearbyPushSubmitting = true;
		nearbyPushError = null;
		try {
			const response = await fetch('/api/expiring-share/nearby-push-settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled: enabled ? 'true' : 'false' })
			});
			const data = (await response.json()) as { ok?: boolean; error?: string; enabled?: boolean };
			if (!response.ok || !data.ok) {
				nearbyPushError =
					data.error === 'push_required'
						? t('nearbySharing.pushRequiresPush')
						: t('nearbySharing.saveFailed');
				nearbyPushEnabled = initialNearbyPushEnabled;
				return;
			}
			nearbyPushEnabled = Boolean(data.enabled);
			prevInitialNearbyPushEnabled = nearbyPushEnabled;
			showClientToast(t('actionToast.settingsSaved'), { variant: 'success' });
		} catch {
			nearbyPushError = t('nearbySharing.saveFailed');
			nearbyPushEnabled = initialNearbyPushEnabled;
		} finally {
			nearbyPushSubmitting = false;
		}
	}

	async function disableNearbySharing() {
		await persistSettings(false);
	}

	/** locationPromise must be started synchronously in toggleNotify (iOS Safari user gesture). */
	async function completeNearbySharingEnable(
		locationPromise: Promise<
			| { ok: true; latitude: number; longitude: number }
			| { ok: false; code: BrowserGeolocationErrorCode }
		>
	) {
		errorMessage = null;
		locating = true;
		const result = await locationPromise;
		locating = false;

		if (!result.ok) {
			nearbySharingEnabled = false;
			errorMessage = await resolveLocationError(result.code);
			return;
		}

		nearbySharingEnabled = true;
		await persistSettings(true, {
			latitude: result.latitude,
			longitude: result.longitude
		});
	}

	async function toggleNearbyPush(enabled: boolean) {
		if (nearbyPushSubmitting) {
			return;
		}
		if (enabled && (!nearbySharingEnabled || !pushNotificationsEnabled)) {
			return;
		}
		await persistNearbyPush(enabled);
	}
</script>

<SettingsSection
	id="settings-nearby-sharing"
	title={t('nearbySharing.settingsTitle')}
	description={t('nearbySharing.settingsDescription')}
>
	<SettingsRow title={t('nearbySharing.enableTitle')} note={t('nearbySharing.enableNote')} last={false}>
		<Toggle
			checked={nearbyToggleChecked}
			label={t('nearbySharing.enableLabel')}
			disabled={nearbyBusy}
			toggleNotify={(enabled) => {
				if (nearbyBusy) {
					return;
				}
				if (!enabled) {
					void disableNearbySharing();
					return;
				}
				// Synchronous geolocation kickoff in the tap handler — required on iOS Safari.
				const locationPromise = startBrowserLocationRequest();
				void completeNearbySharingEnable(locationPromise);
			}}
		/>
		{#if locating}
			<span class="saving">{t('nearbySharing.locating')}</span>
			<span class="hint">{t('nearbySharing.locationAllowPrompt')}</span>
		{:else if submitting}
			<span class="saving">{t('common.saving')}</span>
		{/if}
		{#if errorMessage}
			<p class="error" role="alert">{errorMessage}</p>
		{/if}
		<p class="privacy-note">{t('nearbySharing.privacyNote')}</p>
		<p class="spec-link">
			<a href="https://github.com/arpi09/grocery-manager/blob/master/docs/GRANNSKAFFERIET_V1.md">
				{t('nearbySharing.specLink')}
			</a>
		</p>
	</SettingsRow>

	<SettingsRow
		title={t('nearbySharing.pushTitle')}
		note={t('nearbySharing.pushNote')}
		last={true}
	>
		<Toggle
			checked={nearbyPushEnabled}
			label={t('nearbySharing.pushEnableLabel')}
			disabled={nearbyPushDisabled}
			toggleNotify={(enabled) => {
				void toggleNearbyPush(enabled);
			}}
		/>
		{#if !nearbySharingEnabled && !nearbyPushEnabled}
			<p class="hint">{t('nearbySharing.pushRequiresNearby')}</p>
		{:else if !pushNotificationsEnabled && !nearbyPushEnabled}
			<p class="hint">{t('nearbySharing.pushRequiresPush')}</p>
		{/if}
		{#if nearbyPushError}
			<p class="error" role="alert">{nearbyPushError}</p>
		{/if}
		{#if nearbyPushSubmitting}
			<span class="saving">{t('common.saving')}</span>
		{/if}
		<p class="privacy-note">{t('nearbySharing.pushPrivacyNote')}</p>
	</SettingsRow>
</SettingsSection>

<style>
	.saving {
		display: block;
		margin-top: var(--space-xs);
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.error {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-danger);
	}

	.hint {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.privacy-note {
		margin: var(--space-sm) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		max-width: 42ch;
	}

	.spec-link {
		margin: var(--space-xs) 0 0;
		font-size: 0.8125rem;
	}

	:global(#settings-nearby-sharing) {
		scroll-margin-top: var(--header-height-desktop);
	}

	:global(#settings-nearby-sharing .toggle) {
		min-height: var(--touch-target-min);
	}
</style>
