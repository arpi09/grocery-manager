/**
 * Generates local/brand-palette-preview.html from brand-colors.ts (gitignored output).
 * No hex literals in HTML template strings — values come from TS palette objects only.
 */
import { exec } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

import {
	type BrandColorMode,
	type PaletteTrack,
	PALETTE_TRACK_LIST,
	getLearningAiGradientStops,
	mergePalette,
	toCssCustomProperties
} from '../src/lib/design/brand-colors.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../local/brand-palette-preview.html');

const TRACK_LABELS: Record<PaletteTrack, string> = {
	heritage: 'Heritage',
	fresh: 'Fresh',
	warm: 'Warm',
	crisp: 'Crisp'
};

const LOCATION_KEYS = ['fridge', 'freezer', 'cupboard'] as const;
const TINT_PERCENT = 18;

const SWATCH_KEYS: Array<{ key: string; label: string; wcag?: boolean }> = [
	{ key: '--color-primary', label: 'primary' },
	{ key: '--color-secondary', label: 'secondary' },
	{ key: '--color-accent', label: 'accent' },
	{ key: '--color-success', label: 'success' },
	{ key: '--color-warning', label: 'warning' },
	{ key: '--color-danger', label: 'danger' },
	{ key: '--color-info', label: 'info' },
	{ key: '--color-bg', label: 'bg' },
	{ key: '--color-surface', label: 'surface' },
	{ key: '--color-taupe', label: 'taupe' },
	{ key: '--color-fridge', label: 'fridge', wcag: true },
	{ key: '--color-freezer', label: 'freezer', wcag: true },
	{ key: '--color-cupboard', label: 'cupboard', wcag: true },
	{ key: '--color-learning-ai', label: 'learning', wcag: true }
];

function relativeLuminance(hex: string): number {
	const h = hex.replace('#', '');
	const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
	const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
	return channels.reduce((sum, c, i) => sum + linearize(c) * [0.2126, 0.7152, 0.0722][i]!, 0);
}

function contrastRatio(foreground: string, background: string): number {
	const l1 = relativeLuminance(foreground);
	const l2 = relativeLuminance(background);
	return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function mixHex(foreground: string, background: string, percent: number): string {
	const p = percent / 100;
	const parse = (hex: string) =>
		[parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)] as const;
	const fg = parse(foreground);
	const bg = parse(background);
	const mix = (i: 0 | 1 | 2) => Math.round(fg[i] * p + bg[i] * (1 - p));
	return `#${[mix(0), mix(1), mix(2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function formatRatio(ratio: number): string {
	return `${ratio.toFixed(1)}:1`;
}

function wcagBadge(ratio: number): string {
	if (ratio >= 4.5) return 'aa';
	if (ratio >= 3) return 'large';
	return 'fail';
}

function cssDecls(vars: Record<string, string>): string {
	return Object.entries(vars)
		.map(([name, value]) => `${name}: ${value}`)
		.join('; ');
}

function buildTrackThemeBlock(track: PaletteTrack, mode: BrandColorMode): string {
	const palette = mergePalette(track)[mode];
	const vars = toCssCustomProperties(palette, mode);
	return `.track-${track} {\n  ${cssDecls(vars).replace(/; /g, ';\n  ')}\n}`;
}

function buildLearningAiCss(track: PaletteTrack): string {
	const stops = getLearningAiGradientStops(track).join(', ');
	return `
  .track-${track} .learning-ai-shimmer {
    background: linear-gradient(110deg, ${stops});
    background-size: 220% 100%;
    animation: learning-ai-shift 16s ease-in-out infinite;
  }
  .track-${track} .learning-ai-shimmer--subtle {
    background: linear-gradient(
      110deg,
      color-mix(in srgb, ${getLearningAiGradientStops(track)[0]!} 22%, var(--color-surface)),
      color-mix(in srgb, ${getLearningAiGradientStops(track)[1] ?? getLearningAiGradientStops(track)[0]!} 28%, var(--color-surface)),
      color-mix(in srgb, ${getLearningAiGradientStops(track)[2] ?? getLearningAiGradientStops(track)[0]!} 22%, var(--color-surface)),
      color-mix(in srgb, ${getLearningAiGradientStops(track)[0]!} 22%, var(--color-surface))
    );
    background-size: 220% 100%;
    animation: learning-ai-shift 18s ease-in-out infinite;
  }`;
}

function buildSwatchGrid(track: PaletteTrack, mode: BrandColorMode): string {
	const palette = mergePalette(track)[mode];
	const surface = palette.surface;

	const cells = SWATCH_KEYS.map(({ key, label, wcag }) => {
		if (LOCATION_KEYS.includes(label as (typeof LOCATION_KEYS)[number]) || label === 'learning') {
			const hex =
				label === 'learning'
					? palette.learningAi
					: palette[label as 'fridge' | 'freezer' | 'cupboard'];
			const onSurface = contrastRatio(hex, surface);
			const tint = mixHex(hex, surface, TINT_PERCENT);
			const onTint = contrastRatio(hex, tint);
			const surfaceBadge = wcagBadge(onSurface);
			const tintBadge = wcagBadge(onTint);

			if (label === 'learning') {
				return `<div class="swatch swatch--location">
  <div class="swatch-pair">
    <span class="swatch-chip learning-ai-shimmer" title="gradient"></span>
    <span class="swatch-chip swatch-chip--tint learning-ai-shimmer--subtle" style="color: var(--color-learning-ai)">AI</span>
  </div>
  <span class="swatch-label">${label}</span>
  <span class="wcag-note">surf ${formatRatio(onSurface)} <span class="wcag-${surfaceBadge}">${surfaceBadge}</span> · tint ${formatRatio(onTint)} <span class="wcag-${tintBadge}">${tintBadge}</span></span>
</div>`;
			}

			return `<div class="swatch swatch--location">
  <div class="swatch-pair">
    <span class="swatch-chip" style="background: var(${key})" title="solid"></span>
    <span class="swatch-chip swatch-chip--tint" style="background: color-mix(in srgb, var(${key}) ${TINT_PERCENT}%, var(--color-surface)); color: var(${key})">${label}</span>
  </div>
  <span class="swatch-label">${label}</span>
  <span class="wcag-note">surf ${formatRatio(onSurface)} <span class="wcag-${surfaceBadge}">${surfaceBadge}</span> · tint ${formatRatio(onTint)} <span class="wcag-${tintBadge}">${tintBadge}</span></span>
</div>`;
		}

		const chipClass = 'swatch-chip';
		return `<div class="swatch"><span class="${chipClass}" style="background: var(${key})"></span><span class="swatch-label">${label}</span></div>`;
	}).join('');

	return `<div class="swatch-grid">${cells}</div>`;
}

function buildColumn(track: PaletteTrack): string {
	const label = TRACK_LABELS[track];
	return `
<section class="track-column track-${track}" data-track="${track}">
  <h2 class="track-title">${label}</h2>
  ${buildSwatchGrid(track, 'light')}
  <div class="mock-stack">
    <button type="button" class="btn btn-primary">Primär CTA</button>
    <button type="button" class="btn btn-secondary">Sekundär</button>
    <div class="badge-row">
      <span class="badge badge-success">Sparad</span>
      <span class="badge badge-warning">Snart</span>
      <span class="badge badge-danger">Utgången</span>
      <span class="badge badge-info">Tips</span>
      <span class="badge badge-learning learning-ai-shimmer--subtle">AI</span>
    </div>
    <div class="banner banner-success">Allt ser bra — inget ät-först just nu.</div>
    <div class="banner banner-warning">3 varor går ut inom 48 h.</div>
    <div class="toast toast-success">Tillagd på inköpslistan</div>
    <div class="toast toast-danger">Kunde inte spara</div>
    <div class="chip-row">
      <span class="location-chip location-fridge">Kyl</span>
      <span class="location-chip location-freezer">Frys</span>
      <span class="location-chip location-cupboard">Skafferi</span>
    </div>
    <span class="eat-first-chip">Ät först</span>
  </div>
</section>`;
}

const GLOBAL_CSS = `
  @keyframes learning-ai-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .learning-ai-shimmer,
    .learning-ai-shimmer--subtle {
      animation: none;
      background-position: 0% 50%;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: var(--preview-chrome-bg);
    color: var(--preview-chrome-text);
    transition: background 0.2s, color 0.2s;
  }
  .page-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--preview-chrome-border);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
  }
  .page-header h1 { margin: 0; font-size: 1.25rem; }
  .page-header p { margin: 0; opacity: 0.75; font-size: 0.875rem; }
  .page-header .legend {
    flex-basis: 100%;
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }
  .mode-toggle {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
  }
  .mode-toggle button {
    border: 1px solid var(--preview-chrome-border);
    background: var(--preview-chrome-surface);
    color: var(--preview-chrome-text);
    padding: 0.4rem 0.85rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
  }
  .mode-toggle button[aria-pressed="true"] {
    border-color: var(--preview-chrome-active-border);
    background: var(--preview-chrome-active-bg);
  }
  .columns {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    padding: 1rem;
  }
  @media (max-width: 1100px) {
    .columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .columns { grid-template-columns: 1fr; }
  }
  .track-column {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    padding: 1rem;
    background: var(--color-bg);
    color: var(--color-text);
  }
  .track-title {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    color: var(--color-primary);
  }
  .swatch-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
  .swatch { display: flex; flex-direction: column; gap: 0.2rem; }
  .swatch-pair { display: flex; gap: 0.25rem; }
  .swatch-chip {
    flex: 1;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--color-border);
  }
  .swatch-chip--tint {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .swatch-label {
    font-size: 0.65rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .wcag-note {
    font-size: 0.58rem;
    color: var(--color-text-muted);
    line-height: 1.3;
  }
  .wcag-aa { color: var(--color-success); font-weight: 600; }
  .wcag-large { color: var(--color-warning); font-weight: 600; }
  .wcag-fail { color: var(--color-danger); font-weight: 600; }
  .mock-stack { display: flex; flex-direction: column; gap: 0.5rem; }
  .btn {
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: default;
  }
  .btn-primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .btn-secondary {
    background: var(--color-surface-muted);
    color: var(--color-text);
    border: 1px solid var(--color-border);
  }
  .badge-row, .chip-row { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.45rem;
    border-radius: 999px;
  }
  .badge-success {
    background: color-mix(in srgb, var(--color-success) 18%, var(--color-surface));
    color: var(--color-success);
    border: 1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border));
  }
  .badge-warning {
    background: color-mix(in srgb, var(--color-warning) 18%, var(--color-surface));
    color: var(--color-warning);
    border: 1px solid color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
  }
  .badge-danger {
    background: color-mix(in srgb, var(--color-danger) 18%, var(--color-surface));
    color: var(--color-danger);
    border: 1px solid color-mix(in srgb, var(--color-danger) 35%, var(--color-border));
  }
  .badge-info {
    background: color-mix(in srgb, var(--color-info) 18%, var(--color-surface));
    color: var(--color-info);
    border: 1px solid color-mix(in srgb, var(--color-info) 35%, var(--color-border));
  }
  .badge-learning {
    color: var(--color-learning-ai);
    border: 1px solid color-mix(in srgb, var(--color-learning-ai) 28%, var(--color-border));
  }
  .banner {
    padding: 0.5rem 0.65rem;
    border-radius: 8px;
    font-size: 0.8rem;
    border: 1px solid var(--color-border);
  }
  .banner-success {
    background: color-mix(in srgb, var(--color-success) 10%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-success) 30%, var(--color-border));
    color: var(--color-text);
  }
  .banner-warning {
    background: color-mix(in srgb, var(--color-warning) 12%, var(--color-surface));
    border-color: color-mix(in srgb, var(--color-warning) 35%, var(--color-border));
    color: var(--color-text);
  }
  .toast {
    padding: 0.45rem 0.65rem;
    border-radius: 8px;
    font-size: 0.8rem;
    box-shadow: 0 2px 8px color-mix(in srgb, var(--color-text) 12%, transparent);
  }
  .toast-success {
    background: var(--color-surface);
    color: var(--color-success);
    border: 1px solid color-mix(in srgb, var(--color-success) 40%, var(--color-border));
  }
  .toast-danger {
    background: var(--color-surface);
    color: var(--color-danger);
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, var(--color-border));
  }
  .location-chip {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--color-border);
  }
  .location-fridge {
    background: color-mix(in srgb, var(--color-fridge) ${TINT_PERCENT}%, var(--color-surface));
    color: var(--color-fridge);
    border-color: color-mix(in srgb, var(--color-fridge) 35%, var(--color-border));
  }
  .location-freezer {
    background: color-mix(in srgb, var(--color-freezer) ${TINT_PERCENT}%, var(--color-surface));
    color: var(--color-freezer);
    border-color: color-mix(in srgb, var(--color-freezer) 35%, var(--color-border));
  }
  .location-cupboard {
    background: color-mix(in srgb, var(--color-cupboard) ${TINT_PERCENT}%, var(--color-surface));
    color: var(--color-cupboard);
    border-color: color-mix(in srgb, var(--color-cupboard) 35%, var(--color-border));
  }
  .eat-first-chip {
    display: inline-block;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-success) 16%, transparent);
    color: var(--color-success);
    border: 1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border));
  }
  html[data-preview-mode="light"] {
    --preview-chrome-bg: var(--preview-light-chrome-bg);
    --preview-chrome-text: var(--preview-light-chrome-text);
    --preview-chrome-border: var(--preview-light-chrome-border);
    --preview-chrome-surface: var(--preview-light-chrome-surface);
    --preview-chrome-active-bg: var(--preview-light-chrome-active-bg);
    --preview-chrome-active-border: var(--preview-light-chrome-active-border);
  }
  html[data-preview-mode="dark"] {
    --preview-chrome-bg: var(--preview-dark-chrome-bg);
    --preview-chrome-text: var(--preview-dark-chrome-text);
    --preview-chrome-border: var(--preview-dark-chrome-border);
    --preview-chrome-surface: var(--preview-dark-chrome-surface);
    --preview-chrome-active-bg: var(--preview-dark-chrome-active-bg);
    --preview-chrome-active-border: var(--preview-dark-chrome-active-border);
  }
`;

function buildChromeVars(mode: BrandColorMode): string {
	const heritage = mergePalette('heritage')[mode];
	const vars = toCssCustomProperties(heritage, mode);
	const prefix = mode === 'light' ? 'preview-light-chrome' : 'preview-dark-chrome';
	return `
    --${prefix}-bg: ${vars['--color-bg']};
    --${prefix}-text: ${vars['--color-text']};
    --${prefix}-border: ${vars['--color-border']};
    --${prefix}-surface: ${vars['--color-surface']};
    --${prefix}-active-bg: ${vars['--color-surface-muted']};
    --${prefix}-active-border: ${vars['--color-primary']};
  `;
}

function buildHtml(): string {
	const trackThemesLight = PALETTE_TRACK_LIST.map((t) => buildTrackThemeBlock(t, 'light')).join('\n');
	const trackThemesDark = PALETTE_TRACK_LIST.map((t) => buildTrackThemeBlock(t, 'dark')).join('\n');
	const learningAiPerTrack = PALETTE_TRACK_LIST.map((t) => buildLearningAiCss(t)).join('\n');
	const columns = PALETTE_TRACK_LIST.map((t) => buildColumn(t)).join('\n');

	return `<!DOCTYPE html>
<html lang="sv" data-preview-mode="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Skaffu — palett-preview (Fas 1)</title>
  <style>
    :root {
      ${buildChromeVars('light')}
      ${buildChromeVars('dark')}
    }
    html[data-preview-mode="light"] .track-column { /* per-track vars below */ }
    html[data-preview-mode="light"] {
${trackThemesLight.split('\n').map((l) => '      ' + l).join('\n')}
    }
    html[data-preview-mode="dark"] {
${trackThemesDark.split('\n').map((l) => '      ' + l).join('\n')}
    }
    ${learningAiPerTrack}
    ${GLOBAL_CSS}
  </style>
</head>
<body>
  <header class="page-header">
    <div>
      <h1>Skaffu palett-preview</h1>
      <p>Fas 1 — jämför Heritage / Fresh / Warm / Crisp lokalt</p>
      <p class="legend">WCAG: <span class="wcag-aa">aa</span> ≥4.5:1 · <span class="wcag-large">large</span> ≥3:1 · <span class="wcag-fail">fail</span> &lt;3:1 — surf = text on surface, tint = label on ${TINT_PERCENT}% tint chip</p>
    </div>
    <div class="mode-toggle" role="group" aria-label="Ljus eller mörk">
      <button type="button" data-mode="light" aria-pressed="true">Ljus</button>
      <button type="button" data-mode="dark" aria-pressed="false">Mörk</button>
    </div>
  </header>
  <main class="columns">
    ${columns}
  </main>
  <script>
    const root = document.documentElement;
    const buttons = document.querySelectorAll('.mode-toggle button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        root.setAttribute('data-preview-mode', mode);
        buttons.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      });
    });
  </script>
</body>
</html>`;
}

function openInBrowser(filePath: string): void {
	const quoted = `"${filePath}"`;
	const cmd =
		platform() === 'win32'
			? `start "" ${quoted}`
			: platform() === 'darwin'
				? `open ${quoted}`
				: `xdg-open ${quoted}`;
	exec(cmd, (err) => {
		if (err) console.warn('Could not open browser:', err.message);
	});
}

async function main(): Promise<void> {
	await mkdir(dirname(OUT_PATH), { recursive: true });
	const html = buildHtml();
	await writeFile(OUT_PATH, html, 'utf8');
	console.log(`Written ${OUT_PATH}`);

	if (process.env.npm_lifecycle_event === 'brand:preview' || process.argv.includes('--open')) {
		openInBrowser(OUT_PATH);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
