<script lang="ts">
	import { t } from '$lib/i18n';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import AddItemForm from '$lib/components/organisms/AddItemForm.svelte';
	import type { StorageLocation } from '$lib/domain/location';

	interface Props {
		defaultLocation: StorageLocation;
		errors?: Record<string, string[]>;
		onClose: () => void;
	}

	let { defaultLocation, errors, onClose }: Props = $props();
</script>

<Modal
	open={true}
	onClose={onClose}
	variant="center"
	title={t('item.addTitle')}
	panelClass="add-item-panel"
>
	<AddItemForm {defaultLocation} {errors} />
</Modal>

<style>
	:global(.add-item-panel) {
		width: min(680px, calc(100vw - 2 * var(--space-md)));
	}

	:global(.add-item-panel .btn-primary) {
		color: var(--color-on-primary);
	}
</style>
