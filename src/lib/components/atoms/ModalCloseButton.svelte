<script lang="ts">
	import { t } from '$lib/i18n';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		label?: string;
	}

	let { label, class: className = '', ...rest }: Props = $props();
	const ariaLabel = $derived(label ?? t('common.close'));
</script>

<button type="button" class="modal-close {className}" aria-label={ariaLabel} {...rest}>×</button>

<style>
	.modal-close {
		min-width: 2.75rem;
		min-height: 2.75rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface);
		color: var(--color-text-muted);
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		flex-shrink: 0;
		padding: 0;
	}
</style>
