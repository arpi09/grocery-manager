<script lang="ts">
	import DeleteConfirmButton from '$lib/components/molecules/DeleteConfirmButton.svelte';
	import type { MemoryFacetType } from '$lib/application/household-suggestions.service';
	import type { StorageLocation } from '$lib/domain/location';
	import { t } from '$lib/i18n';

	interface Props {
		type: MemoryFacetType;
		normalizedKey: string;
		location: StorageLocation;
		displayName: string;
	}

	let { type, normalizedKey, location, displayName }: Props = $props();

	const action = $derived(
		type === 'shelf_life' ? '?/resetShelfLifeSuggestion' : '?/resetLocationSuggestion'
	);
</script>

<DeleteConfirmButton
	tier={1}
	context="generic"
	copyOptions={{ itemName: displayName }}
	{action}
	label={t('memory.forget')}
	ariaLabel={t('memory.forgetConfirm')}
	variant="secondary"
	fullWidth
>
	<input type="hidden" name="normalizedKey" value={normalizedKey} />
	{#if type === 'shelf_life'}
		<input type="hidden" name="location" value={location} />
	{/if}
</DeleteConfirmButton>
