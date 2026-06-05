<script lang="ts">
	import { Sparkles } from '@lucide/svelte';
	import MarketingButtonLink from '$lib/components/marketing/MarketingButtonLink.svelte';
	import type { MarketingProLaunch } from '$lib/marketing/content';

	interface Props {
		proLaunch: MarketingProLaunch;
		registerUrl: string;
		onRegisterClick?: () => void;
	}

	let { proLaunch, registerUrl, onRegisterClick }: Props = $props();
</script>

<section class="pro-launch" aria-labelledby="pro-launch-title">
	<div class="pro-launch-inner">
		<div class="pro-launch-copy">
			<p class="pro-launch-badge label-caps">
				<Sparkles size={14} strokeWidth={2} aria-hidden="true" />
				{proLaunch.badge}
			</p>
			<h2 id="pro-launch-title" class="pro-launch-title">{proLaunch.title}</h2>
			<p class="pro-launch-lead">{proLaunch.lead}</p>
			<ul class="pro-launch-bullets">
				{#each proLaunch.bullets as bullet (bullet)}
					<li>{bullet}</li>
				{/each}
			</ul>
			<div class="pro-launch-actions">
				<MarketingButtonLink href="/priser">{proLaunch.ctaPricing}</MarketingButtonLink>
				<MarketingButtonLink href={registerUrl} variant="secondary" onclick={onRegisterClick}>
					{proLaunch.ctaFree}
				</MarketingButtonLink>
			</div>
		</div>
		<p class="pro-launch-price" aria-label={proLaunch.priceFrom}>{proLaunch.priceFrom}</p>
	</div>
</section>

<style>
	.pro-launch {
		padding: 0 var(--space-lg) var(--space-lg);
	}

	.pro-launch-inner {
		position: relative;
		max-width: 72rem;
		margin: 0 auto;
		padding: var(--space-lg) var(--space-xl);
		border-radius: var(--radius-lg);
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--color-primary) 10%, var(--color-surface)),
			var(--color-surface)
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		box-shadow: var(--shadow-sm);
		overflow: hidden;
	}

	.pro-launch-inner::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 70% 80% at 100% 0%,
			color-mix(in srgb, var(--color-accent) 14%, transparent),
			transparent 55%
		);
		pointer-events: none;
	}

	.pro-launch-copy {
		position: relative;
		max-width: 52rem;
	}

	.pro-launch-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0;
		color: var(--color-primary);
	}

	.pro-launch-title {
		margin: var(--space-sm) 0 0;
		font-size: clamp(1.35rem, 3vw, 1.75rem);
		font-weight: var(--font-weight-display);
		line-height: 1.15;
		letter-spacing: -0.02em;
	}

	.pro-launch-lead {
		margin: var(--space-md) 0 0;
		color: var(--color-text-muted);
		line-height: var(--line-height-body);
		max-width: 52ch;
	}

	.pro-launch-bullets {
		margin: var(--space-md) 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: var(--space-sm);
	}

	.pro-launch-bullets li {
		position: relative;
		padding-left: 1.1rem;
		font-size: var(--font-size-body-sm);
		line-height: var(--line-height-body);
		color: var(--color-text);
	}

	.pro-launch-bullets li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 999px;
		background: var(--color-primary);
	}

	.pro-launch-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		margin-top: var(--space-lg);
	}

	.pro-launch-price {
		position: absolute;
		right: var(--space-lg);
		bottom: var(--space-lg);
		margin: 0;
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		letter-spacing: var(--letter-spacing-label);
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	@media (max-width: 720px) {
		.pro-launch-inner {
			padding: var(--space-lg);
		}

		.pro-launch-price {
			position: static;
			margin-top: var(--space-md);
			text-align: left;
		}
	}
</style>
