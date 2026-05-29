<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		note?: string;
		href?: string;
		last?: boolean;
		children?: Snippet;
	}

	let { title, note, href, last = false, children }: Props = $props();
</script>

{#if href}
	<a href={href} class="settings-row settings-row-link" class:last>
		<div class="row-content">
			<p class="row-title">{title}</p>
			{#if note}
				<p class="row-note">{note}</p>
			{/if}
		</div>
		<span class="chevron" aria-hidden="true">›</span>
	</a>
{:else}
	<div class="settings-row" class:last>
		<div class="row-content">
			<p class="row-title">{title}</p>
			{#if note}
				<p class="row-note">{note}</p>
			{/if}
		</div>
		{#if children}
			<div class="row-actions">
				{@render children()}
			</div>
		{/if}
	</div>
{/if}

<style>
	.settings-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--color-border);
	}

	.settings-row.last {
		border-bottom: none;
	}

	.settings-row-link {
		text-decoration: none;
		color: inherit;
		transition: background 0.12s ease;
	}

	.settings-row-link:hover {
		background: var(--color-surface-muted);
	}

	.settings-row-link:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
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

	.row-actions {
		display: flex;
		flex-shrink: 0;
		flex-wrap: wrap;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	.chevron {
		flex-shrink: 0;
		font-size: 1.25rem;
		line-height: 1;
		color: var(--color-text-muted);
	}

	@media (max-width: 640px) {
		.settings-row {
			flex-direction: column;
			align-items: stretch;
		}

		.row-actions {
			justify-content: flex-start;
		}
	}
</style>
