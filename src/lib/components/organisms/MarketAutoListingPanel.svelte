<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Toggle from '$lib/components/atoms/Toggle.svelte';
	import SkaffuSettingsToggleRow from '$lib/components/molecules/SkaffuSettingsToggleRow.svelte';
	import SettingsSection from '$lib/components/molecules/SettingsSection.svelte';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		autoNearbyListingEnabled: boolean;
		nearbySharingEnabled: boolean;
	}

	let { autoNearbyListingEnabled: initialEnabled, nearbySharingEnabled }: Props = $props();

	let autoListingEnabled = $state(initialEnabled);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let prevInitialEnabled = $state(initialEnabled);

	const toggleDisabled = $derived(submitting || !nearbySharingEnabled);

	$effect(() => {
		if (initialEnabled !== prevInitialEnabled) {
			prevInitialEnabled = initialEnabled;
			autoListingEnabled = initialEnabled;
		}
	});

	async function persistAutoListing(enabled: boolean) {
		submitting = true;
		errorMessage = null;
		try {
			const response = await fetch('/api/market/auto-listing-settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled })
			});
			const data = (await response.json()) as { ok?: boolean; error?: string; enabled?: boolean };
			if (!response.ok || !data.ok) {
				errorMessage = data.error ?? t('marketV01.autoListingSaveFailed');
				autoListingEnabled = initialEnabled;
				return;
			}
			autoListingEnabled = Boolean(data.enabled);
			prevInitialEnabled = autoListingEnabled;
			await invalidateAll();
			showClientToast(t('actionToast.settingsSaved'), { variant: 'success' });
		} catch {
			errorMessage = t('marketV01.autoListingSaveFailed');
			autoListingEnabled = initialEnabled;
		} finally {
			submitting = false;
		}
	}

	async function toggleAutoListing(enabled: boolean) {
		if (submitting) {
			return;
		}
		if (enabled && !nearbySharingEnabled) {
			return;
		}
		autoListingEnabled = enabled;
		await persistAutoListing(enabled);
	}
</script>

<SettingsSection
	id="market-auto-listing"
	title={t('marketV01.autoListingTitle')}
	description={t('marketV01.autoListingDescription')}
>
	<SkaffuSettingsToggleRow
		title={t('marketV01.autoListingEnableTitle')}
		note={t('marketV01.autoListingEnableNote')}
		last={true}
	>
		{#snippet control()}
			<Toggle
				checked={autoListingEnabled}
				label={t('marketV01.autoListingEnableLabel')}
				disabled={toggleDisabled}
				toggleNotify={(enabled) => {
					void toggleAutoListing(enabled);
				}}
			/>
		{/snippet}
		{#snippet below()}
			{#if !nearbySharingEnabled}
				<p class="hint">{t('marketV01.autoListingRequiresNearby')}</p>
			{/if}
			{#if submitting}
				<span class="saving">{t('common.saving')}</span>
			{/if}
			{#if errorMessage}
				<p class="error" role="alert">{errorMessage}</p>
			{/if}
			<p class="privacy-note">{t('marketV01.autoListingPrivacyNote')}</p>
		{/snippet}
	</SkaffuSettingsToggleRow>
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
</style>
