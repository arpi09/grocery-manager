<script lang="ts">
	import AppLogo from '$lib/components/atoms/AppLogo.svelte';
	import Badge from '$lib/components/atoms/Badge.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import LearningAiBadge from '$lib/components/atoms/LearningAiBadge.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import {
		brandFontSizes,
		brandFontWeights,
		BRAND_FONT_FAMILY,
		BRAND_FONT_STACK,
	} from '$lib/design/brand/typography';
	import { brandRadius, brandSpace } from '$lib/design/brand/layout';
	import {
		DEFAULT_PALETTE_TRACK,
		getLearningAiGradientStops,
		LOCKED_LOGO_CORE,
		mergePalette,
		PWA_ICON_VERSION,
		type BrandColorMode
	} from '$lib/design/brand-colors';

	const typographyRows = [
		{ label: 'display', token: '--font-size-display', value: brandFontSizes.display, sampleClass: 'type-display' },
		{ label: 'body', token: '--font-size-body', value: brandFontSizes.body, sampleClass: 'type-body' },
		{ label: 'body-sm', token: '--font-size-body-sm', value: brandFontSizes.bodySm, sampleClass: 'type-body-sm' },
		{ label: 'label', token: '--font-size-label', value: brandFontSizes.label, sampleClass: 'type-label' }
	];

	const layoutRows = [
		{ label: 'radius sm/md/lg', value: `${brandRadius.sm} / ${brandRadius.md} / ${brandRadius.lg}` },
		{ label: 'space md/lg', value: `${brandSpace.md} / ${brandSpace.lg}` }
	];

	let mode = $state<BrandColorMode>('light');

	const track = DEFAULT_PALETTE_TRACK;
	const palette = $derived(mergePalette(track)[mode]);

	const coreSwatches = $derived([
		{ label: 'primary', token: '--color-primary', value: palette.primary },
		{ label: 'primaryHover', token: '--color-primary-hover', value: palette.primaryHover },
		{ label: 'onPrimary', token: '--color-on-primary', value: palette.onPrimary },
		{ label: 'accent', token: '--color-accent', value: palette.accent },
		{ label: 'bg', token: '--color-bg', value: palette.bg },
		{ label: 'surface', token: '--color-surface', value: palette.surface },
		{ label: 'surfaceMuted', token: '--color-surface-muted', value: palette.surfaceMuted },
		{ label: 'border', token: '--color-border', value: palette.border },
		{ label: 'text', token: '--color-text', value: palette.text },
		{ label: 'textMuted', token: '--color-text-muted', value: palette.textMuted }
	]);

	const semanticSwatches = $derived([
		{ label: 'secondary', token: '--color-secondary', value: palette.secondary },
		{ label: 'taupe', token: '--color-taupe', value: palette.taupe },
		{ label: 'success', token: '--color-success', value: palette.success },
		{ label: 'warning', token: '--color-warning', value: palette.warning },
		{ label: 'danger', token: '--color-danger', value: palette.danger },
		{ label: 'info', token: '--color-info', value: palette.info },
		{ label: 'fridge', token: '--color-fridge', value: palette.fridge },
		{ label: 'freezer', token: '--color-freezer', value: palette.freezer },
		{ label: 'cupboard', token: '--color-cupboard', value: palette.cupboard },
		{ label: 'learningAi', token: '--color-learning-ai', value: palette.learningAi }
	]);

	const learningGradient = $derived(getLearningAiGradientStops(track, mode).join(', '));

	const semanticUsage = [
		{ token: 'info', usage: 'AiLoadingSkeleton — AI-loading tint' },
		{ token: 'secondary / taupe', usage: 'ActivationOnboarding kivra-card, EatHubHero gradient' },
		{ token: 'learning-ai', usage: 'LearningAiBadge — smart fill & recipe ideas' },
		{ token: 'success / warning / danger', usage: 'Badge, FeedbackBanner' }
	];

	function setMode(next: BrandColorMode) {
		mode = next;
		document.documentElement.dataset.theme = next;
	}

	$effect(() => {
		document.documentElement.dataset.theme = mode;
		return () => {
			document.documentElement.dataset.theme = 'light';
		};
	});
</script>

<svelte:head>
	<title>Skaffu — varumärkespalett ({track})</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="description" content="Aktiv Fresh-palett — låsta loggfärger + semantiska tokens." />
</svelte:head>

<main class="brand-page">
	<header class="brand-header">
		<AppLogo size="md" showWordmark />
		<div class="header-copy">
			<h1>Varumärkespalett</h1>
			<p>Aktivt spår: <strong>{track}</strong> · logotypfärger låsta i alla spår</p>
		</div>
		<div class="mode-toggle" role="group" aria-label="Ljus eller mörk">
			<button type="button" aria-pressed={mode === 'light'} onclick={() => setMode('light')}>Ljus</button>
			<button type="button" aria-pressed={mode === 'dark'} onclick={() => setMode('dark')}>Mörk</button>
		</div>
	</header>

	<section class="panel">
		<h2>Låsta loggfärger</h2>
		<p class="hint">Oförändliga i heritage / fresh / warm / crisp</p>
		<div class="swatch-grid">
			{#each Object.entries(LOCKED_LOGO_CORE.light) as [key, hex] (key)}
				<div class="swatch">
					<span class="chip" style={`background: ${hex}`}></span>
					<span class="label">{key}</span>
					<code>{hex}</code>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2>Kärntokens (CSS)</h2>
		<div class="swatch-grid">
			{#each coreSwatches as swatch (swatch.token)}
				<div class="swatch">
					<span class="chip" style={`background: ${swatch.value}`}></span>
					<span class="label">{swatch.label}</span>
					<code>{swatch.token}</code>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2>Semantik — {track}</h2>
		<p class="hint">Kyl = grön · Frys = frostgrå · Skafferi = varm accent</p>
		<div class="swatch-grid">
			{#each semanticSwatches as swatch (swatch.token)}
				<div class="swatch">
					<span class="chip" style={`background: ${swatch.value}`}></span>
					<span class="label">{swatch.label}</span>
					<code>{swatch.token}</code>
				</div>
			{/each}
		</div>
		<div class="learning-gradient" style={`background: linear-gradient(110deg, ${learningGradient})`}>
			<span class="learning-gradient-label">learningAi gradient</span>
		</div>
		<ul class="usage-list">
			{#each semanticUsage as row (row.token)}
				<li><strong>{row.token}</strong> — {row.usage}</li>
			{/each}
		</ul>
	</section>

	<section class="panel">
		<h2>Typografi</h2>
		<p class="hint">
			Källa: <code>src/lib/design/brand/typography.ts</code> · {BRAND_FONT_FAMILY} · Google Fonts vikter
			{brandFontWeights.body}/{brandFontWeights.medium}/{brandFontWeights.semibold}/{brandFontWeights.display}
		</p>
		<p class="meta-line"><code>{BRAND_FONT_STACK}</code></p>
		<div class="type-samples">
			{#each typographyRows as row (row.token)}
				<div class="type-row">
					<span class={row.sampleClass}>{row.label}</span>
					<code>{row.token}</code>
					<span class="meta">{row.value}</span>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2>Layout</h2>
		<p class="hint">Källa: <code>src/lib/design/brand/layout.ts</code> · PWA icon v{PWA_ICON_VERSION}</p>
		<ul class="layout-list">
			{#each layoutRows as row (row.label)}
				<li><strong>{row.label}</strong> — {row.value}</li>
			{/each}
		</ul>
		<p class="meta-line shadows">Shadow: <code>--shadow-sm</code> / <code>--shadow-md</code></p>
	</section>

	<section class="panel">
		<h2>Komponentgalleri</h2>
		<div class="gallery">
			<div class="gallery-row">
				<Button variant="primary">Primär CTA</Button>
				<Button variant="secondary">Sekundär</Button>
				<Button variant="ghost">Ghost</Button>
			</div>
			<div class="gallery-row badges">
				<Badge tone="default">Neutral</Badge>
				<Badge tone="warning">Snart</Badge>
				<LearningAiBadge variant="gradient" />
				<LearningAiBadge variant="soft" />
			</div>
			<FeedbackBanner tone="success" message="Allt ser bra ut — inget ät-först just nu." />
			<FeedbackBanner tone="warning" message="3 varor går ut inom 48 h." />
			<FeedbackBanner tone="error" message="Kunde inte spara ändringen." />
			<div class="gallery-row locations">
				<span class="loc fridge">Kyl</span>
				<span class="loc freezer">Frys</span>
				<span class="loc cupboard">Skafferi</span>
			</div>
		</div>
	</section>
</main>

<style>
	.brand-page {
		max-width: 960px;
		margin: 0 auto;
		padding: var(--space-lg) var(--page-padding-x) var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--page-section-gap);
	}

	.brand-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-md);
	}

	.header-copy h1 {
		margin: 0 0 0.25rem;
		font-size: var(--font-size-display);
	}

	.header-copy p {
		margin: 0;
		color: var(--color-text-muted);
		font-size: var(--font-size-body-sm);
	}

	.mode-toggle {
		margin-left: auto;
		display: flex;
		gap: var(--space-sm);
	}

	.mode-toggle button {
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		padding: 0.4rem 0.85rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		font: inherit;
	}

	.mode-toggle button[aria-pressed='true'] {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
	}

	.panel {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		background: var(--color-surface);
	}

	.panel h2 {
		margin: 0 0 var(--space-xs);
		font-size: 1.125rem;
	}

	.hint {
		margin: 0 0 var(--space-md);
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.swatch-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: var(--space-sm);
	}

	.swatch {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.chip {
		height: 2.5rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border);
	}

	.label {
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		text-transform: uppercase;
		letter-spacing: var(--letter-spacing-label);
		color: var(--color-text-muted);
	}

	code {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.learning-gradient {
		margin-top: var(--space-md);
		padding: var(--space-md);
		border-radius: var(--radius-md);
		text-align: center;
		font-weight: 600;
		border: 1px solid var(--color-border);
	}

	.learning-gradient-label {
		color: var(--color-on-primary);
	}

	.usage-list {
		margin: var(--space-md) 0 0;
		padding-left: 1.25rem;
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.gallery {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.gallery-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}

	.badge-learning {
		display: inline-flex;
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
		border: 1px solid color-mix(in srgb, var(--color-learning-ai) 35%, var(--color-border));
	}

	.loc {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.2rem 0.55rem;
		border-radius: 999px;
		border: 1px solid var(--color-border);
	}

	.fridge {
		background: color-mix(in srgb, var(--color-fridge) 18%, var(--color-surface));
		color: var(--color-fridge);
	}

	.freezer {
		background: color-mix(in srgb, var(--color-freezer) 18%, var(--color-surface));
		color: var(--color-freezer);
	}

	.cupboard {
		background: color-mix(in srgb, var(--color-cupboard) 18%, var(--color-surface));
		color: var(--color-cupboard);
	}

	.type-samples {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.type-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: var(--space-sm);
		align-items: baseline;
	}

	.type-display {
		font-size: var(--font-size-display);
		font-weight: var(--font-weight-display);
	}

	.type-body {
		font-size: var(--font-size-body);
	}

	.type-body-sm {
		font-size: var(--font-size-body-sm);
	}

	.type-label {
		font-size: var(--font-size-label);
		font-weight: var(--font-weight-label);
		letter-spacing: var(--letter-spacing-label);
		text-transform: uppercase;
	}

	.meta-line {
		margin: 0 0 var(--space-sm);
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.meta {
		font-size: var(--font-size-body-sm);
		color: var(--color-text-muted);
	}

	.layout-list {
		margin: 0;
		padding-left: 1.25rem;
		font-size: var(--font-size-body-sm);
	}
</style>
