<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import ConsumeItemPanel from '$lib/components/molecules/ConsumeItemPanel.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		item: InventoryItem | null;
		onClose: () => void;
		action?: string;
	}

	let { open, item, onClose, action = '/inventory?/consumeItem' }: Props = $props();

	function handleConsumeSuccess() {
		void invalidateAll();
	}
</script>

{#if item}
	<Modal
		{open}
		{onClose}
		variant="sheet"
		title={t('pantry.v2.tile.consumeSheetTitle', { name: item.name })}
		data-testid="inventory-consume-sheet"
	>
		<ConsumeItemPanel
			{item}
			{action}
			variant="form"
			{onClose}
			onSuccess={handleConsumeSuccess}
		/>
	</Modal>
{/if}
