<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		children: Snippet;
	}

	let { title, description, children }: Props = $props();

	const headingId = $derived(`settings-${title.toLowerCase().replace(/\s+/g, '-')}`);
</script>

	<section class="settings-section" aria-labelledby={headingId}>
	<header class="section-header">
		<h2 id={headingId} class="label-caps">{title}</h2>
		{#if description}
			<p class="section-description">{description}</p>
		{/if}
	</header>
	<div class="section-group">
		{@render children()}
	</div>
</section>

<style>
	.settings-section {
		margin-bottom: var(--space-xl);
	}

	.settings-section:last-child {
		margin-bottom: 0;
	}

	.section-header {
		margin-bottom: var(--space-sm);
		padding: 0 var(--space-xs);
	}

	.section-header h2 {
		margin: 0;
	}

	.section-description {
		margin: 0.25rem 0 0;
		font-size: 0.82rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}

	.section-group {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}
</style>
