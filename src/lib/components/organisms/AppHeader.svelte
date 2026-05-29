<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
	}

	let { title, subtitle }: Props = $props();
</script>

<header class="page-header">
	<h1>{title}</h1>
	{#if subtitle}
		<p class="subtitle">{subtitle}</p>
	{/if}
</header>

<style>
	.page-header {
		width: 100%;
		max-width: var(--page-max-width);
		margin-inline: auto;
		margin-top: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	@media (min-width: 900px) {
		.page-header {
			margin-top: var(--space-lg);
		}
	}

	h1 {
		margin: 0;
		font-size: clamp(1.35rem, 2.5vw, 1.65rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}

	.subtitle {
		margin: var(--space-xs) 0 0;
		color: var(--color-text-muted);
		font-size: 0.92rem;
		line-height: 1.45;
		max-width: 42ch;
	}
</style>
