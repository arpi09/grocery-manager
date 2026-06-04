<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import { t } from '$lib/i18n';
	import { scanHubHref, scanModeHref } from '$lib/utils/scan-nav';
	import type { StorageLocation } from '$lib/domain/location';

	interface Props {
		returnTo: string;
		defaultLocation?: StorageLocation | string;
	}

	let { returnTo, defaultLocation }: Props = $props();

	const locationOption = $derived(
		defaultLocation && typeof defaultLocation === 'string'
			? { location: defaultLocation }
			: defaultLocation
				? { location: defaultLocation as StorageLocation }
				: undefined
	);

	const barcodeHref = $derived(scanModeHref('barcode', returnTo, locationOption));
	const receiptHref = $derived(scanModeHref('receipt', returnTo));
	const photoHref = $derived(scanModeHref('photo', returnTo, locationOption));
	const manualHref = $derived(
		`/item/new?from=${encodeURIComponent(scanHubHref(returnTo))}${defaultLocation ? `&location=${defaultLocation}` : ''}`
	);
</script>

<div class="hub" data-testid="scan-mode-hub">
	<article class="hero" data-testid="scan-hub-hero">
		<div class="hero-visual" aria-hidden="true">
			<svg class="hero-illustration" viewBox="0 0 200 140" role="presentation">
				<rect x="8" y="18" width="184" height="104" rx="16" fill="color-mix(in srgb, var(--color-primary) 10%, var(--color-surface))" />
				<rect x="24" y="34" width="72" height="72" rx="12" fill="color-mix(in srgb, var(--color-primary) 18%, var(--color-surface-muted))" />
				<circle cx="60" cy="58" r="14" fill="color-mix(in srgb, var(--color-primary) 35%, transparent)" />
				<path
					d="M44 88 L76 64 L92 78 L116 52 L152 88 Z"
					fill="color-mix(in srgb, var(--color-primary) 22%, var(--color-surface-muted))"
				/>
				<rect x="108" y="42" width="68" height="8" rx="4" fill="var(--color-border)" />
				<rect x="108" y="58" width="52" height="8" rx="4" fill="var(--color-border)" />
				<rect x="108" y="74" width="60" height="8" rx="4" fill="color-mix(in srgb, var(--color-primary) 40%, var(--color-border))" />
			</svg>
		</div>
		<div class="hero-copy">
			<h2 class="hero-title">{t('photoRound.title')}</h2>
			<p class="hero-subtitle">{t('scan.hubHero.subtitle')}</p>
			<a class="hero-cta" href={photoHref} data-testid="scan-hub-photo-round">
				{t('scan.hubHero.cta')}
			</a>
		</div>
	</article>

	<section class="more-ways" aria-labelledby="scan-more-ways-heading">
		<h2 id="scan-more-ways-heading" class="more-ways-heading label-caps">
			{t('scan.moreWays')}
		</h2>
		<div class="secondary-row" data-testid="scan-hub-mode-grid">
			<Card href={barcodeHref} interactive class="compact-tile" data-testid="scan-hub-barcode">
				<span class="icon-wrap" aria-hidden="true">
					<FeatureIcon id="barcode" size={22} />
				</span>
				<span class="compact-label">{t('scan.modes.barcode')}</span>
			</Card>

			<Card href={receiptHref} interactive class="compact-tile" data-testid="scan-hub-receipt">
				<span class="icon-wrap" aria-hidden="true">
					<FeatureIcon id="receipt" size={22} />
				</span>
				<span class="compact-label">{t('scan.modes.receipt')}</span>
			</Card>

			<Card href={manualHref} interactive class="compact-tile" data-testid="scan-hub-manual">
				<span class="icon-wrap" aria-hidden="true">
					<FeatureIcon id="box" size={22} />
				</span>
				<span class="compact-label">{t('scan.modes.manual')}</span>
			</Card>
		</div>
	</section>
</div>

<style>
	.hub {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.hero {
		display: grid;
		gap: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-lg);
		border: 1px solid color-mix(in srgb, var(--color-primary) 28%, var(--color-border));
		background: linear-gradient(
			145deg,
			color-mix(in srgb, var(--color-primary) 8%, var(--color-surface)) 0%,
			var(--color-surface) 55%
		);
	}

	@media (min-width: 520px) {
		.hero {
			grid-template-columns: minmax(7rem, 9rem) 1fr;
			align-items: center;
		}
	}

	.hero-visual {
		display: flex;
		justify-content: center;
	}

	.hero-illustration {
		width: 100%;
		max-width: 11rem;
		height: auto;
	}

	.hero-copy {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		min-width: 0;
	}

	.hero-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 650;
		line-height: 1.2;
	}

	.hero-subtitle {
		margin: 0;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.hero-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		align-self: flex-start;
		margin-top: var(--space-xs);
		padding: 0.65rem 1.1rem;
		border-radius: var(--radius-md);
		background: var(--color-primary);
		color: var(--color-on-primary);
		font-size: var(--font-size-body-sm);
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.hero-cta:hover {
		background: color-mix(in srgb, var(--color-primary) 88%, var(--color-text));
	}

	.hero-cta:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.more-ways {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.more-ways-heading {
		margin: 0;
		padding: 0;
	}

	.secondary-row {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-sm);
	}

	:global(.compact-tile) {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-xs);
		min-height: 5.5rem;
		text-align: center;
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.compact-label {
		font-size: 0.8rem;
		font-weight: 600;
		line-height: 1.2;
	}
</style>
