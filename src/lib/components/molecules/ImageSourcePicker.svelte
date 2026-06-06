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

	$effect(() => {
		const inputs = [cameraInputEl, fileInputEl].filter(Boolean) as HTMLInputElement[];
		for (const input of inputs) {
			input.addEventListener('change', handleChange);
		}
		return () => {
			for (const input of inputs) {
				input.removeEventListener('change', handleChange);
			}
		};
	});
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
	<label class="file-picker-btn btn btn-secondary btn-full picker-btn" class:is-disabled={disabled}>
		{fileLabel}
		<input
			bind:this={fileInputEl}
			type="file"
			{accept}
	class="sr-input"
	data-testid="receipt-file-input"
	{disabled}
/>
	</label>
</div>

<input
	bind:this={cameraInputEl}
	type="file"
	accept={cameraAccept}
	capture="environment"
	class="sr-input"
	aria-label={cameraLabel}
	{disabled}
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

	.file-picker-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		margin: 0;
	}

	.file-picker-btn.is-disabled {
		opacity: 0.55;
		cursor: not-allowed;
		pointer-events: none;
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
