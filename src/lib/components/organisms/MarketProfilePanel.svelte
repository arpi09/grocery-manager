<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import { marketFirstName as resolveMarketFirstName, prefersMarketAvatarSetup } from '$lib/domain/market-profile';
	import { userInitials } from '$lib/domain/user';
	import { t } from '$lib/i18n';
	import { showClientToast } from '$lib/utils/client-toast.svelte';

	interface Props {
		displayName?: string | null;
		email: string;
		avatarUrl?: string | null;
		marketFirstName?: string | null;
	}

	let {
		displayName = null,
		email,
		avatarUrl = null,
		marketFirstName: initialFirstName = null
	}: Props = $props();

	let marketFirstNameInput = $state(
		initialFirstName ?? resolveMarketFirstName({ displayName, marketFirstName: initialFirstName })
	);
	let saving = $state(false);

	const initials = $derived(userInitials(displayName, email));
	const needsSetup = $derived(
		prefersMarketAvatarSetup({ marketFirstName: marketFirstNameInput, avatarUrl })
	);

	async function saveProfile() {
		const trimmed = marketFirstNameInput.trim();
		if (!trimmed) {
			return;
		}

		saving = true;
		try {
			const response = await fetch('/api/market/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ marketFirstName: trimmed })
			});
			if (!response.ok) {
				showClientToast(t('marketV01.profileSaveFailed'), { variant: 'error' });
				return;
			}
			showClientToast(t('marketV01.profileSaved'), { variant: 'success' });
		} catch {
			showClientToast(t('marketV01.profileSaveFailed'), { variant: 'error' });
		} finally {
			saving = false;
		}
	}
</script>

<section class="profile-panel" aria-labelledby="market-profile-heading" data-testid="market-profile-panel">
	<h2 id="market-profile-heading">{t('marketV01.profileTitle')}</h2>
	<p class="lead">{t('marketV01.profileLead')}</p>

	<Card class="profile-card">
		<div class="identity-row">
			{#if avatarUrl}
				<img class="avatar" src={avatarUrl} alt="" />
			{:else}
				<span class="avatar avatar-fallback" aria-hidden="true">{initials}</span>
			{/if}
			<div class="identity-copy">
				<p class="display-name">{resolveMarketFirstName({ displayName, marketFirstName: marketFirstNameInput })}</p>
				{#if needsSetup}
					<p class="setup-note">{t('marketV01.profileAvatarHint')}</p>
				{/if}
			</div>
		</div>

		<form
			class="profile-form"
			onsubmit={(event) => {
				event.preventDefault();
				void saveProfile();
			}}
		>
			<FormField
				label={t('marketV01.profileFirstNameLabel')}
				name="marketFirstName"
				type="text"
				autocomplete="given-name"
				bind:value={marketFirstNameInput}
				placeholder={t('marketV01.profileFirstNamePlaceholder')}
			/>
			<div class="actions">
				<Button type="submit" loading={saving} loadingLabel={t('common.saving')}>
					{t('marketV01.profileSaveBtn')}
				</Button>
				<Button type="button" variant="secondary" onclick={() => goto('/profile')}>
					{t('marketV01.profileAvatarCta')}
				</Button>
			</div>
		</form>
	</Card>
</section>

<style>
	.profile-panel {
		display: grid;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	h2 {
		margin: 0;
		font-size: 1rem;
	}

	.lead {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	:global(.profile-card) {
		display: grid;
		gap: var(--space-md);
	}

	.identity-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.avatar {
		width: 3rem;
		height: 3rem;
		border-radius: 999px;
		object-fit: cover;
	}

	.avatar-fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface-muted);
		font-weight: 700;
	}

	.display-name {
		margin: 0;
		font-weight: 700;
	}

	.setup-note {
		margin: var(--space-2xs) 0 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.profile-form {
		display: grid;
		gap: var(--space-sm);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
	}
</style>
