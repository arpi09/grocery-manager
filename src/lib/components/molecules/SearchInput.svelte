<script lang="ts">
	interface Props {
		value: string;
		placeholder?: string;
		id?: string;
	}

	let { value = $bindable(''), placeholder = 'Search items…', id }: Props = $props();
</script>

<div class="search">
	<span class="icon" aria-hidden="true">⌕</span>
	<input type="search" {id} {placeholder} bind:value class="search-input" />
</div>

<style>
	.search {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-height: var(--touch-target-min);
		padding: 0.5rem 0.85rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
	}

	.icon {
		color: var(--color-text-muted);
	}

	.search-input {
		flex: 1;
		min-height: var(--touch-target-min);
		border: none;
		background: transparent;
		outline: none;
		font-size: 1rem;
		line-height: 1.4;
	}
</style>
