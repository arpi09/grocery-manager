<script lang="ts">
	import SkaffuListItem from '$lib/components/molecules/SkaffuListItem.svelte';

	interface Props {
		href: string;
		title: string;
		secondary?: string;
	}

	let { href, title, secondary }: Props = $props();
</script>

<SkaffuListItem class="settings-link-row">
	<a {href} class="link-inner">
		<span class="text-block">
			<span class="primary">{title}</span>
			{#if secondary}
				<span class="secondary">{secondary}</span>
			{/if}
		</span>
		<span class="chevron" aria-hidden="true">›</span>
	</a>
</SkaffuListItem>

<style>
	:global(.settings-link-row .mdc-deprecated-list-item__wrapper) {
		padding: 0;
	}

	.link-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		width: 100%;
		min-height: var(--touch-target-min);
		padding: var(--space-sm) var(--space-md);
		text-decoration: none;
		color: inherit;
		transition: background 0.12s ease;
	}

	.link-inner:hover {
		background: var(--color-surface-muted);
	}

	.link-inner:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: -2px;
	}

	.text-block {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.primary {
		font-size: 0.875rem;
		font-weight: 600;
		line-height: 1.35;
		color: var(--color-text);
	}

	.secondary {
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
	}

	.chevron {
		flex-shrink: 0;
		font-size: 1.25rem;
		line-height: 1;
		color: var(--color-text-muted);
	}
</style>
