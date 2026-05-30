<script lang="ts">
	import { t } from '$lib/i18n';
	import Button from '$lib/components/atoms/Button.svelte';

	interface Props {
		cameraLabel: string;
		fileLabel: string;
		accept?: string;
		cameraAccept?: string;
		disabled?: boolean;
		onSelect: (file: File) => void;
	}

	let {
		cameraLabel,
		fileLabel,
		accept = 'image/*',
		cameraAccept = 'image/*',
		disabled = false,
		onSelect
	}: Props = $props();

	let cameraInputEl = $state<HTMLInputElement | null>(null);
	let fileInputEl = $state<HTMLInputElement | null>(null);

	function handleChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			onSelect(file);
		}
		input.value = '';
	}
</script>

<div class="picker" role="group" aria-label={t('receipt.pickSourceAria')}>
	<Button
		type="button"
		variant="primary"
		fullWidth
		class="picker-btn"
		{disabled}
		onclick={() => cameraInputEl?.click()}
	>
		{cameraLabel}
	</Button>
	<Button
		type="button"
		variant="secondary"
		fullWidth
		class="picker-btn"
		{disabled}
		onclick={() => fileInputEl?.click()}
	>
		{fileLabel}
	</Button>
</div>

<input
	bind:this={cameraInputEl}
	type="file"
	accept={cameraAccept}
	capture="environment"
	class="sr-input"
	{disabled}
	onchange={handleChange}
/>
<input
	bind:this={fileInputEl}
	type="file"
	{accept}
	class="sr-input"
	{disabled}
	onchange={handleChange}
/>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	:global(.picker-btn) {
		min-height: 2.75rem;
	}

	.sr-input {
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
