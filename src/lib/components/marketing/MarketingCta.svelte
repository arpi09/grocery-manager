<script lang="ts">
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';

	interface Props {
		title: string;
		lead?: string;
		primaryLabel: string;
		primaryHref: string;
		secondaryLabel?: string;
		secondaryHref?: string;
		onRegisterClick?: () => void;
	}

	let {
		title,
		lead,
		primaryLabel,
		primaryHref,
		secondaryLabel,
		secondaryHref,
		onRegisterClick
	}: Props = $props();
</script>

<section class="cta-section">
	<div class="inner">
		<h2 class="title">{title}</h2>
		{#if lead}
			<p class="lead">{lead}</p>
		{/if}
		<div class="actions">
			<MarketingButtonLink href={primaryHref}>{primaryLabel}</MarketingButtonLink>
			{#if secondaryLabel && secondaryHref}
				<MarketingButtonLink href={secondaryHref} variant="secondary" onclick={onRegisterClick}>
					{secondaryLabel}
				</MarketingButtonLink>
			{/if}
		</div>
	</div>
</section>

<style>
	.cta-section {
		padding: var(--space-xl) var(--space-lg);
	}

	.inner {
		max-width: 42rem;
		margin: 0 auto;
		text-align: center;
		padding: var(--space-xl);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-md);
	}

	.title {
		margin: 0;
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
		line-height: 1.2;
	}

	.lead {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--space-md);
		margin-top: var(--space-lg);
	}

	@media (max-width: 480px) {
		.actions {
			flex-direction: column;
		}
	}
</style>
