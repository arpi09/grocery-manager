<script lang="ts">
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import SettingsRow from '$lib/components/molecules/SettingsRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		nearbySharingEnabled: boolean;
	}

	let { nearbySharingEnabled: initialEnabled }: Props = $props();

	let nearbySharingEnabled = $state(initialEnabled);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		nearbySharingEnabled = initialEnabled;
	});

	async function requestBrowserLocation(): Promise<GeolocationPosition | null> {
		if (!navigator.geolocation) {
			return null;
		}
		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => resolve(position),
				() => resolve(null),
				{ enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 }
			);
		});
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
			showClientToast(t('actionToast.settingsSaved'), { variant: 'success' });
		} catch {
			errorMessage = t('nearbySharing.saveFailed');
			nearbySharingEnabled = initialEnabled;
		} finally {
			submitting = false;
		}
	}

	async function toggleNearbySharing(enabled: boolean) {
		if (submitting) {
			return;
		}

		if (!enabled) {
			await persistSettings(false);
			return;
		}

		const position = await requestBrowserLocation();
		if (!position) {
			nearbySharingEnabled = false;
			errorMessage = t('nearbySharing.locationDenied');
			return;
		}

		await persistSettings(true, {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		});
	}
</script>

<SettingsSection
	id="settings-nearby-sharing"
	title={t('nearbySharing.settingsTitle')}
	description={t('nearbySharing.settingsDescription')}
>
	<SettingsRow title={t('nearbySharing.enableTitle')} note={t('nearbySharing.enableNote')} last={true}>
		<Toggle
			checked={nearbySharingEnabled}
			label={t('nearbySharing.enableLabel')}
			disabled={submitting}
			onchange={(enabled) => {
				nearbySharingEnabled = enabled;
				void toggleNearbySharing(enabled);
			}}
		/>
		{#if submitting}
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
</style>
