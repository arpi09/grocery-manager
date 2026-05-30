<script lang="ts">
	import FeatureIcon, { type FeatureIconId } from '$lib/components/atoms/FeatureIcon.svelte';
	import type { MarketingFeature } from '$lib/marketing/content';

	interface Props {
		feature: MarketingFeature;
	}

	let { feature }: Props = $props();

	const iconId = $derived(feature.icon as FeatureIconId);
</script>

<article class="feature-card">
	<div class="icon-wrap">
		<FeatureIcon id={iconId} size={28} />
	</div>
	<h3 class="title">{feature.title}</h3>
	<p class="description">{feature.description}</p>
</article>

<style>
	.feature-card {
		padding: var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-primary);
		margin-bottom: var(--space-md);
	}

	.title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.description {
		margin: var(--space-sm) 0 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
	}
</style>
