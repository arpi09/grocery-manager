<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		note?: string;
		last?: boolean;
		control: Snippet;
		below?: Snippet;
	}

	let { title, note, last = false, control, below }: Props = $props();
</script>

<div class="settings-toggle-row" class:last>
	<div class="row-main">
		<div class="row-content">
			<p class="row-title">{title}</p>
			{#if note}
				<p class="row-note">{note}</p>
			{/if}
		</div>
		<div class="row-control">
			{@render control()}
		</div>
	</div>
	{#if below}
		<div class="row-below">
			{@render below()}
		</div>
	{/if}
</div>

<style>
	.settings-toggle-row {
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.settings-toggle-row.last {
		border-bottom: none;
	}

	.row-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.row-content {
		min-width: 0;
		flex: 1;
	}

	.row-title {
		margin: 0;
		font-weight: 600;
		font-size: 0.95rem;
		line-height: 1.35;
	}

	.row-note {
		margin: 0.2rem 0 0;
		color: var(--color-text-muted);
		font-size: 0.84rem;
		line-height: 1.4;
	}

	.row-control {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: flex-end;
	}

	.row-below {
		margin-top: var(--space-sm);
	}

	.row-control :global(.toggle) {
		flex-direction: row-reverse;
	}

	.row-control :global(.toggle-label) {
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
