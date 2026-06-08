<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import { LOCATIONS, type StorageLocation } from '$lib/domain/location';
	import { t } from '$lib/i18n';
	import { locationLabel } from '$lib/i18n/domain-labels';
	import { getLocale } from '$lib/i18n';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';
	import { getQuickAddDefaultLocation, saveQuickAddDefaultLocation } from '$lib/utils/quick-add-defaults';

	interface Props {
		recentNames: string[];
	}

	let { recentNames }: Props = $props();
	let name = $state('');
	let submitting = $state(false);
	let location = $state<StorageLocation>(getQuickAddDefaultLocation());
</script>

<form
	method="POST"
	action="?/quickAdd"
	class="quick-add"
	use:enhance={bindSubmitting((v) => (submitting = v))}
	aria-label={t('home.quickAddAria')}
>
	<input type="hidden" name="location" value={location} />
	<label class="sr-only" for="home-quick-add-input">{t('home.quickAddPlaceholder')}</label>
	<input
		id="home-quick-add-input"
		name="name"
		type="text"
		list="home-quick-add-suggestions"
		placeholder={t('home.quickAddPlaceholder')}
		bind:value={name}
		required
		autocomplete="off"
		data-testid="home-quick-add-input"
	/>
	<datalist id="home-quick-add-suggestions">
		{#each recentNames as recentName (recentName)}
			<option value={recentName}></option>
		{/each}
	</datalist>
	<Button type="submit" variant="secondary" loading={submitting} loadingLabel={t('common.saving')}>
		{t('home.quickAddSubmit')}
	</Button>
</form>
<div class="chips">
	{#each LOCATIONS as loc}
		<button
			type="button"
			class="chip"
			class:active={location === loc}
			onclick={() => {
				location = loc;
				saveQuickAddDefaultLocation(loc);
			}}
		>
			{locationLabel(getLocale(), loc)}
		</button>
	{/each}
	<a class="barcode-link" href="/scan?mode=barcode&from=/hem">{t('home.quickAddBarcode')}</a>
</div>

<style>
	.quick-add {
		display: flex;
		gap: var(--space-sm);
		align-items: stretch;
	}

	.quick-add input {
		flex: 1;
		min-width: 0;
		min-height: var(--touch-target-min);
		padding: 0.55rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		font: inherit;
	}

	.quick-add input:focus {
		outline: 2px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
		outline-offset: 1px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin-top: var(--space-xs);
	}

	.chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		border-radius: 999px;
		padding: 0 var(--space-md);
		font: inherit;
	}

	.chip.active {
		border-color: var(--color-primary);
	}

	.barcode-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
	}
</style>
