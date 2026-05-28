<script lang="ts">
	import { enhance } from '$app/forms';
	import AppLayout from '$lib/components/templates/AppLayout.svelte';
	import AppHeader from '$lib/components/organisms/AppHeader.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import Card from '$lib/components/atoms/Card.svelte';
	import FormField from '$lib/components/molecules/FormField.svelte';
	import { THEME_LABELS, THEME_PREFERENCES, type ThemePreference } from '$lib/domain/theme';
	import { userInitials } from '$lib/domain/user';

	let { data, form } = $props();

	const profile = $derived(form?.profile ?? data.profile);
	const displayName = $derived(form?.values?.displayName ?? profile.displayName ?? '');
	const initials = $derived(userInitials(profile.displayName, profile.email));
	const selectedTheme = $derived(
		(form?.themePreference as ThemePreference | undefined) ?? data.themePreference
	);

	let avatarInput = $state(data.profile.avatarUrl ?? '');
	let fileError = $state<string | undefined>(undefined);

	const MAX_FILE_BYTES = 100_000;

	async function onAvatarFileSelected(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		fileError = undefined;
		if (!file) {
			return;
		}

		if (!file.type.startsWith('image/')) {
			fileError = 'Välj en bildfil (PNG, JPEG, GIF eller WebP).';
			input.value = '';
			return;
		}

		if (file.size > MAX_FILE_BYTES) {
			fileError = 'Bilden får vara högst 100 KB.';
			input.value = '';
			return;
		}

		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				avatarInput = reader.result;
			}
		};
		reader.readAsDataURL(file);
	}

	function clearAvatar() {
		avatarInput = '';
		fileError = undefined;
	}
</script>

<AppLayout user={data.user}>
	<AppHeader title="Profil" subtitle="Redigera ditt konto" />
	<Card>
		{#if form?.success}
			<p class="banner success" role="status">Profilen sparades.</p>
		{/if}

		<div class="preview">
			{#if avatarInput}
				<img class="preview-avatar" src={avatarInput} alt="" />
			{:else}
				<span class="preview-initials" aria-hidden="true">{initials}</span>
			{/if}
			<div>
				<p class="preview-name">{profile.displayName?.trim() || 'Inget visningsnamn'}</p>
				<p class="preview-email">{profile.email}</p>
			</div>
		</div>

		<form
			method="POST"
			action="?/save"
			class="profile-form"
			use:enhance={() => {
				return async ({ update }) => {
					await update({ invalidateAll: true });
				};
			}}
		>
			<FormField
				label="Visningsnamn"
				name="displayName"
				type="text"
				autocomplete="name"
				value={displayName}
				error={form?.errors?.displayName?.[0]}
				placeholder="t.ex. Arvid"
			/>

			<FormField
				label="E-post"
				name="email"
				type="email"
				value={profile.email}
				readonly
				disabled
			/>

			<FormField
				label="Profilbild (URL)"
				name="avatarUrl"
				type="url"
				bind:value={avatarInput}
				error={form?.errors?.avatarUrl?.[0] ?? fileError}
				placeholder="https://..."
			/>

			<div class="upload-row">
				<label class="file-label">
					Ladda upp bild
					<input
						type="file"
						accept="image/png,image/jpeg,image/gif,image/webp"
						onchange={onAvatarFileSelected}
					/>
				</label>
				{#if avatarInput}
					<Button type="button" variant="secondary" onclick={clearAvatar}>Ta bort bild</Button>
				{/if}
			</div>

			<Button type="submit">Spara profil</Button>
		</form>
	</Card>

	<Card>
		<h2 class="section-title">Tema</h2>
		<p class="section-lead">Välj ljust, mörkt eller följ systemets inställning.</p>

		{#if form?.themeSuccess}
			<p class="banner success" role="status">Tema sparades.</p>
		{/if}

		<form
			method="POST"
			action="?/updateTheme"
			class="theme-form"
			use:enhance={() => {
				return async ({ update }) => {
					await update({ invalidateAll: true });
				};
			}}
		>
			<fieldset class="theme-options">
				<legend class="sr-only">Tema</legend>
				{#each THEME_PREFERENCES as preference (preference)}
					<label class="theme-option">
						<input
							type="radio"
							name="themePreference"
							value={preference}
							checked={selectedTheme === preference}
						/>
						<span>{THEME_LABELS[preference]}</span>
					</label>
				{/each}
			</fieldset>
			{#if form?.themeErrors?.themePreference?.[0]}
				<p class="theme-error" role="alert">{form.themeErrors.themePreference[0]}</p>
			{/if}
			<Button type="submit">Spara tema</Button>
		</form>
	</Card>
</AppLayout>

<style>
	.banner {
		margin: 0 0 var(--space-md);
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
	}

	.banner.success {
		background: #e8f5ee;
		color: #1f5c3f;
	}

	.preview {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
		padding: var(--space-md);
		background: var(--color-surface-muted);
		border-radius: var(--radius-md);
	}

	.preview-avatar,
	.preview-initials {
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 999px;
		flex-shrink: 0;
	}

	.preview-avatar {
		object-fit: cover;
		border: 1px solid var(--color-border);
	}

	.preview-initials {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		font-weight: 700;
		color: var(--color-primary);
	}

	.preview-name {
		margin: 0;
		font-weight: 700;
	}

	.preview-email {
		margin: 0.2rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.profile-form,
	.theme-form {
		display: flex;
		flex-direction: column;
	}

	.upload-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
	}

	.file-label {
		display: inline-flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.9rem;
	}

	.file-label input[type='file'] {
		font-size: 0.85rem;
	}

	.section-title {
		margin: 0 0 var(--space-xs);
		font-size: 1.1rem;
	}

	.section-lead {
		margin: 0 0 var(--space-md);
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.theme-options {
		margin: 0 0 var(--space-md);
		padding: 0;
		border: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.theme-option {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.theme-error {
		margin: calc(-1 * var(--space-sm)) 0 var(--space-md);
		color: var(--color-danger, #b42318);
		font-size: 0.9rem;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>