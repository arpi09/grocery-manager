import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = join(import.meta.dirname, '..');

function write(relativePath, content) {
	const full = join(root, relativePath);
	mkdirSync(dirname(full), { recursive: true });
	writeFileSync(full, content, 'utf8');
	console.log('wrote', relativePath);
}

function patch(relativePath, replacements) {
	const full = join(root, relativePath);
	let content = readFileSync(full, 'utf8');
	for (const [from, to] of replacements) {
		if (!content.includes(from)) {
			throw new Error(`patch miss in ${relativePath}: ${from.slice(0, 80)}…`);
		}
		content = content.replace(from, to);
	}
	writeFileSync(full, content, 'utf8');
	console.log('patched', relativePath);
}

// ── New domain files ─────────────────────────────────────────────────────────

write(
	'src/lib/domain/learning/expiry-badge-presenter.ts',
	`import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import type { PredictionSource } from '$lib/domain/learning/predictor-types';
import {
	confidenceToTier,
	type ConfidenceTier
} from '$lib/domain/learning/prediction-trust';

export type ExpiryBadgeSource = ExpiresOnSource | PredictionSource | null | undefined;

export interface ExpiryBadgePresentation {
	labelKey: string;
	sourceHintKey: string | null;
	color: string | null;
	tone: 'default' | 'warning' | 'location';
	lowConfidence: boolean;
	confidenceTier: ConfidenceTier | null;
}

const SOURCE_COLORS: Partial<Record<string, string>> = {
	household_learned: '#2d6a4f',
	household_rule: '#2d6a4f',
	receipt_printed: '#1d4ed8',
	evidence: '#1d4ed8',
	ai_inferred: '#6b4c9a',
	external_model: '#6b4c9a',
	llm: '#6b4c9a',
	heuristic: '#6b7280',
	default_heuristic: '#6b7280',
	default: '#6b7280',
	location_default: '#0f766e',
	catalog: '#475569'
};

function sourceHintKey(source: ExpiryBadgeSource): string | null {
	if (!source) return null;
	if (source === 'household_learned' || source === 'household_rule') {
		return 'learning.sourceHousehold';
	}
	if (source === 'location_default') return 'learning.sourceLocationDefault';
	if (source === 'ai_inferred' || source === 'external_model' || source === 'llm') {
		return 'learning.sourceAiGuess';
	}
	if (source === 'receipt_printed' || source === 'evidence') return 'learning.sourceReceipt';
	if (
		source === 'heuristic' ||
		source === 'default_heuristic' ||
		source === 'default' ||
		source === 'catalog'
	) {
		return 'learning.sourceDefault';
	}
	return null;
}

export function presentExpiryBadge(input: {
	source?: ExpiryBadgeSource;
	confidence?: number | null;
	lowConfidence?: boolean;
}): ExpiryBadgePresentation {
	const tier = input.confidence != null ? confidenceToTier(input.confidence) : null;
	const lowConfidence = input.lowConfidence ?? tier === 'low';
	const source = input.source ?? null;

	let labelKey = 'learning.estimatedExpiry';
	if (lowConfidence) {
		labelKey = 'learning.lowConfidence';
	} else if (tier === 'high' && (source === 'household_learned' || source === 'household_rule')) {
		labelKey = 'learning.confidenceSure';
	} else if (tier === 'high' && (source === 'receipt_printed' || source === 'evidence')) {
		labelKey = 'learning.confidenceSure';
	}

	return {
		labelKey,
		sourceHintKey: sourceHintKey(source),
		color: source ? (SOURCE_COLORS[source] ?? null) : null,
		tone: lowConfidence ? 'warning' : 'default',
		lowConfidence,
		confidenceTier: tier
	};
}
`
);

write(
	'src/lib/domain/learning/expiry-badge-presenter.test.ts',
	`import { describe, expect, it } from 'vitest';
import { presentExpiryBadge } from './expiry-badge-presenter';

describe('presentExpiryBadge', () => {
	it('uses confidenceSure for high household_learned', () => {
		const result = presentExpiryBadge({ source: 'household_learned', confidence: 0.9 });
		expect(result.labelKey).toBe('learning.confidenceSure');
		expect(result.lowConfidence).toBe(false);
		expect(result.color).toBe('#2d6a4f');
	});

	it('uses lowConfidence label when tier is low', () => {
		const result = presentExpiryBadge({ source: 'ai_inferred', confidence: 0.3 });
		expect(result.labelKey).toBe('learning.lowConfidence');
		expect(result.lowConfidence).toBe(true);
		expect(result.tone).toBe('warning');
	});

	it('maps receipt_printed to sourceReceipt hint', () => {
		expect(presentExpiryBadge({ source: 'receipt_printed' }).sourceHintKey).toBe(
			'learning.sourceReceipt'
		);
	});

	it('assigns purple tone color for ai_inferred', () => {
		expect(presentExpiryBadge({ source: 'ai_inferred', confidence: 0.6 }).color).toBe('#6b4c9a');
	});
});
`
);

write(
	'src/lib/domain/brain-ai-usage.ts',
	`import type { ReceiptLocationPrediction, ReceiptShelfLifePrediction } from '$lib/domain/receipt-line';

const LOW_CONFIDENCE_THRESHOLD = 0.4;

export interface BrainAiUsageCounts {
	shelfLifeEstimates: number;
	locationSuggestions: number;
	lowConfidence: number;
	total: number;
}

export function emptyBrainAiUsageCounts(): BrainAiUsageCounts {
	return {
		shelfLifeEstimates: 0,
		locationSuggestions: 0,
		lowConfidence: 0,
		total: 0
	};
}

function isLowConfidencePrediction(prediction: ReceiptShelfLifePrediction): boolean {
	if (prediction.confidence != null) {
		return prediction.confidence < LOW_CONFIDENCE_THRESHOLD;
	}
	return prediction.expiresOnSource === 'default_heuristic';
}

export function aggregateBrainAiUsageFromPredictions(
	shelfLifePredictions: Array<ReceiptShelfLifePrediction | null | undefined>,
	locationPredictions: Array<ReceiptLocationPrediction | null | undefined>
): BrainAiUsageCounts {
	let shelfLifeEstimates = 0;
	let locationSuggestions = 0;
	let lowConfidence = 0;

	for (const prediction of shelfLifePredictions) {
		if (!prediction?.expiresOn) continue;
		shelfLifeEstimates += 1;
		if (isLowConfidencePrediction(prediction)) lowConfidence += 1;
	}

	for (const prediction of locationPredictions) {
		if (!prediction?.location) continue;
		locationSuggestions += 1;
	}

	const total = shelfLifeEstimates + locationSuggestions;
	return { shelfLifeEstimates, locationSuggestions, lowConfidence, total };
}

export function hasBrainAiUsage(counts: BrainAiUsageCounts): boolean {
	return counts.total > 0;
}
`
);

write(
	'src/lib/domain/brain-score.ts',
	`export interface BrainScoreInput {
	ruleCount: number;
	feedbackCount: number;
	receiptLineCount: number;
}

export interface BrainScoreSnapshot {
	score: number;
	labelKey: string;
	ruleCount: number;
	feedbackCount: number;
	receiptLineCount: number;
}

export function computeBrainScore(input: BrainScoreInput): number {
	const { ruleCount, feedbackCount, receiptLineCount } = input;
	const raw = ruleCount * 8 + feedbackCount * 3 + Math.min(receiptLineCount, 25) * 2;
	return Math.min(100, Math.round(raw));
}

export function getSnapshot(input: BrainScoreInput): BrainScoreSnapshot {
	const score = computeBrainScore(input);
	let labelKey = 'brain.score.new';
	if (score >= 60) labelKey = 'brain.score.strong';
	else if (score >= 25) labelKey = 'brain.score.growing';

	return {
		score,
		labelKey,
		ruleCount: input.ruleCount,
		feedbackCount: input.feedbackCount,
		receiptLineCount: input.receiptLineCount
	};
}
`
);

write(
	'src/lib/domain/brain-score.test.ts',
	`import { describe, expect, it } from 'vitest';
import { computeBrainScore, getSnapshot } from './brain-score';

describe('computeBrainScore', () => {
	it('returns 0 for empty household', () => {
		expect(computeBrainScore({ ruleCount: 0, feedbackCount: 0, receiptLineCount: 0 })).toBe(0);
	});

	it('caps at 100', () => {
		expect(
			computeBrainScore({ ruleCount: 50, feedbackCount: 50, receiptLineCount: 100 })
		).toBeLessThanOrEqual(100);
	});

	it('weights rules and receipt lines', () => {
		expect(
			computeBrainScore({ ruleCount: 2, feedbackCount: 0, receiptLineCount: 5 })
		).toBeGreaterThan(0);
	});
});

describe('getSnapshot', () => {
	it('returns label key based on tier', () => {
		const snap = getSnapshot({ ruleCount: 5, feedbackCount: 3, receiptLineCount: 10 });
		expect(snap.labelKey).toMatch(/^brain\\.score/);
		expect(snap.score).toBe(computeBrainScore({ ruleCount: 5, feedbackCount: 3, receiptLineCount: 10 }));
	});
});
`
);

// ── New Svelte components ───────────────────────────────────────────────────

write(
	'src/lib/components/molecules/EstimatedBadge.svelte',
	`<script lang="ts">
	import Badge from '$lib/components/atoms/Badge.svelte';
	import PredictionExplainSheet from '$lib/components/molecules/PredictionExplainSheet.svelte';
	import type { ExpiresOnSource } from '$lib/domain/auto-expired';
	import { presentExpiryBadge } from '$lib/domain/learning/expiry-badge-presenter';
	import type { PredictionSource } from '$lib/domain/learning/predictor-types';
	import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';
	import type { ReceiptLocationPrediction } from '$lib/domain/receipt-line';
	import { t } from '$lib/i18n';

	type EstimatedSource =
		| ExpiresOnSource
		| PredictionSource
		| ReceiptLocationPrediction['source']
		| null
		| undefined;

	interface Props {
		source?: EstimatedSource;
		explanation?: PredictionExplanation | null;
		showSettingsLink?: boolean;
		label?: string;
		interactive?: boolean;
		lowConfidence?: boolean;
		lineConfidence?: number | null;
	}

	let {
		source = null,
		explanation = null,
		showSettingsLink = false,
		label,
		interactive = true,
		lowConfidence = false,
		lineConfidence = null
	}: Props = $props();

	const presentation = $derived(
		presentExpiryBadge({ source, confidence: lineConfidence, lowConfidence })
	);

	const badgeLabel = $derived(label ?? t(presentation.labelKey));

	let expanded = $state(false);
	let sheetOpen = $state(false);

	const sourceHint = $derived.by(() => {
		if (!presentation.sourceHintKey) return null;
		return t(presentation.sourceHintKey);
	});

	const hasExplanation = $derived(Boolean(explanation?.primary?.trim()));

	function onBadgeClick() {
		if (hasExplanation) {
			sheetOpen = true;
			return;
		}
		if (!sourceHint) return;
		expanded = !expanded;
	}

	const showSettingsInSheet = $derived(
		showSettingsLink || source === 'household_learned' || source === 'household_rule'
	);
</script>

<span class="estimated-badge-wrap">
	{#if !interactive}
		<Badge tone={presentation.tone} color={presentation.color ?? undefined}>{badgeLabel}</Badge>
	{:else if sourceHint || hasExplanation}
		<button
			type="button"
			class="estimated-badge-btn"
			aria-expanded={hasExplanation ? sheetOpen : expanded}
			aria-label="{badgeLabel}, {explanation?.primary ?? sourceHint ?? ''}"
			onclick={onBadgeClick}
		>
			<Badge tone={presentation.tone} color={presentation.color ?? undefined}>{badgeLabel}</Badge>
		</button>
		{#if !hasExplanation && expanded && sourceHint}
			<span class="source-hint" role="status">{sourceHint}</span>
		{/if}
	{:else}
		<Badge tone={presentation.tone} color={presentation.color ?? undefined}>{badgeLabel}</Badge>
	{/if}
</span>

{#if hasExplanation && explanation}
	<PredictionExplainSheet
		open={sheetOpen}
		{explanation}
		showSettingsLink={showSettingsInSheet}
		onClose={() => {
			sheetOpen = false;
		}}
	/>
{/if}

<style>
	.estimated-badge-wrap {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.estimated-badge-btn {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		min-width: 2.75rem;
		border: none;
		background: none;
		padding: 0.25rem 0;
		cursor: pointer;
		font: inherit;
	}

	.source-hint {
		font-size: 0.7rem;
		color: var(--color-text-muted);
		line-height: 1.3;
		max-width: 12rem;
	}
</style>
`
);

write(
	'src/lib/components/molecules/ReceiptQualityMeter.svelte',
	`<script lang="ts">
	import type { ReceiptImportQualityReport } from '$lib/domain/receipt-quality-report';
	import { t } from '$lib/i18n';

	interface Props {
		report: ReceiptImportQualityReport;
	}

	let { report }: Props = $props();
</script>

<div class="quality-meter" role="status" data-testid="receipt-quality-meter">
	<p class="quality-lead">{t('brain.receiptQuality.lead', { percent: report.bbfCoveragePercent })}</p>
	<div class="quality-bar" aria-hidden="true">
		<span class="quality-fill" style="width: {Math.min(100, report.bbfCoveragePercent)}%"></span>
	</div>
	<ul class="quality-stats">
		<li>{t('brain.receiptQuality.highConfidence', { count: report.highConfidence })}</li>
		<li>{t('brain.receiptQuality.estimated', { count: report.estimated })}</li>
		<li>{t('brain.receiptQuality.missing', { count: report.missing })}</li>
	</ul>
</div>

<style>
	.quality-meter {
		margin: var(--space-md) 0;
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
	}

	.quality-lead {
		margin: 0 0 var(--space-sm);
		font-size: 0.875rem;
		font-weight: 600;
	}

	.quality-bar {
		height: 0.5rem;
		border-radius: 999px;
		background: var(--color-border);
		overflow: hidden;
		margin-bottom: var(--space-sm);
	}

	.quality-fill {
		display: block;
		height: 100%;
		background: color-mix(in srgb, var(--color-primary) 70%, #2d6a4f);
		border-radius: inherit;
	}

	.quality-stats {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm) var(--space-md);
	}
</style>
`
);

write(
	'src/lib/components/molecules/BrainAiUsageFooter.svelte',
	`<script lang="ts">
	import type { BrainAiUsageCounts } from '$lib/domain/brain-ai-usage';
	import { hasBrainAiUsage } from '$lib/domain/brain-ai-usage';
	import { t } from '$lib/i18n';

	interface Props {
		counts: BrainAiUsageCounts;
	}

	let { counts }: Props = $props();

	const visible = $derived(hasBrainAiUsage(counts));
</script>

{#if visible}
	<p class="brain-ai-footer" role="status" data-testid="brain-ai-usage-footer">
		{t('brain.aiUsage.footer', {
			shelfLife: counts.shelfLifeEstimates,
			location: counts.locationSuggestions,
			low: counts.lowConfidence
		})}
	</p>
{/if}

<style>
	.brain-ai-footer {
		margin: var(--space-md) 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
</style>
`
);

write(
	'src/lib/components/molecules/ReceiptParseStepIndicator.svelte',
	`<script lang="ts">
	import { t } from '$lib/i18n';

	export type ReceiptParseStep = 'extract' | 'classify' | 'predict';

	interface Props {
		step: ReceiptParseStep;
	}

	let { step }: Props = $props();

	const steps: ReceiptParseStep[] = ['extract', 'classify', 'predict'];
	const stepIndex = $derived(steps.indexOf(step));
</script>

<ol class="parse-steps" aria-label={t('brain.parseStep.aria')} data-testid="receipt-parse-steps">
	{#each steps as parseStep, index (parseStep)}
		<li class="parse-step" class:active={index <= stepIndex} class:current={parseStep === step}>
			<span class="step-dot" aria-hidden="true"></span>
			<span class="step-label">{t(\`brain.parseStep.\${parseStep}\`)}</span>
		</li>
	{/each}
</ol>

<style>
	.parse-steps {
		display: flex;
		gap: var(--space-sm);
		margin: var(--space-md) 0;
		padding: 0;
		list-style: none;
	}

	.parse-step {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.parse-step.active {
		color: var(--color-text);
		font-weight: 600;
	}

	.step-dot {
		width: 0.65rem;
		height: 0.65rem;
		border-radius: 50%;
		border: 2px solid var(--color-border);
		background: var(--color-surface);
	}

	.parse-step.active .step-dot {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 25%, var(--color-surface));
	}

	.parse-step.current .step-dot {
		background: var(--color-primary);
	}

	.step-label {
		text-align: center;
		line-height: 1.2;
	}
</style>
`
);

write(
	'src/lib/components/molecules/BrainHomeCard.svelte',
	`<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import type { BrainScoreSnapshot } from '$lib/domain/brain-score';
	import { t } from '$lib/i18n';

	interface Props {
		snapshot: BrainScoreSnapshot;
		href?: string;
	}

	let { snapshot, href = '/settings/memory' }: Props = $props();
</script>

<Card {href} interactive class="brain-home-card" data-testid="brain-home-card">
	<div class="brain-card-inner">
		<span class="brain-icon" aria-hidden="true"><FeatureIcon id="sparkle" size={22} /></span>
		<div class="brain-copy">
			<p class="brain-score" aria-label={t('brain.homeCard.scoreAria', { score: snapshot.score })}>
				{t('brain.homeCard.score', { score: snapshot.score })}
			</p>
			<p class="brain-label">{t(snapshot.labelKey)}</p>
			<p class="brain-body">{t('brain.homeCard.body')}</p>
		</div>
	</div>
</Card>

<style>
	.brain-home-card {
		margin-bottom: var(--space-md);
	}

	.brain-card-inner {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.brain-icon {
		flex-shrink: 0;
		color: var(--color-primary);
	}

	.brain-copy {
		min-width: 0;
	}

	.brain-score {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.brain-label {
		margin: 0.15rem 0 0;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.brain-body {
		margin: 0.35rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
		line-height: 1.35;
	}
</style>
`
);

write(
	'src/lib/components/organisms/InventoryInsightsPanel.svelte',
	`<script lang="ts">
	import Card from '$lib/components/atoms/Card.svelte';
	import type { InventoryItem } from '$lib/domain/inventory-item';
	import { countMissingExpiry } from '$lib/domain/pantry-shelf';
	import { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
	import { t } from '$lib/i18n';

	interface Props {
		items: InventoryItem[];
		canWrite?: boolean;
		bulkExpiryHref?: string | null;
	}

	let { items, canWrite = false, bulkExpiryHref = null }: Props = $props();

	const missingExpiry = $derived(countMissingExpiry(items));
	const estimatedCount = $derived(
		items.filter((item) => isEstimatedExpirySource(item.expiresOnSource)).length
	);
</script>

{#if missingExpiry > 0 || estimatedCount > 0}
	<section class="insights-panel" aria-labelledby="inventory-insights-heading" data-testid="inventory-insights">
		<h2 id="inventory-insights-heading" class="insights-title">{t('brain.insights.title')}</h2>
		<div class="insights-grid">
			{#if missingExpiry > 0}
				<Card class="insight-card">
					<p class="insight-stat">{missingExpiry}</p>
					<p class="insight-label">{t('brain.insights.missingExpiry')}</p>
					{#if canWrite && bulkExpiryHref}
						<a class="insight-link" href={bulkExpiryHref}>{t('inventory.bulkExpiryAction')}</a>
					{/if}
				</Card>
			{/if}
			{#if estimatedCount > 0}
				<Card class="insight-card">
					<p class="insight-stat">{estimatedCount}</p>
					<p class="insight-label">{t('brain.insights.estimatedCount')}</p>
				</Card>
			{/if}
		</div>
	</section>
{/if}

<style>
	.insights-panel {
		margin-bottom: var(--space-lg);
	}

	.insights-title {
		margin: 0 0 var(--space-sm);
		font-size: 0.9375rem;
		font-weight: 700;
	}

	.insights-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: var(--space-sm);
	}

	.insight-card {
		padding: var(--space-md);
		text-align: center;
	}

	.insight-stat {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 700;
		line-height: 1.1;
	}

	.insight-label {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: var(--color-text-muted);
	}

	.insight-link {
		display: inline-block;
		margin-top: var(--space-sm);
		font-size: 0.8125rem;
		font-weight: 600;
	}
</style>
`
);

// ── i18n patches ──────────────────────────────────────────────────────────────

for (const localeFile of ['src/lib/i18n/locales/en.json', 'src/lib/i18n/locales/sv.json']) {
	const isEn = localeFile.includes('en.json');
	const full = join(root, localeFile);
	const json = JSON.parse(readFileSync(full, 'utf8'));

	json.learning ??= {};
	json.learning.confidenceSure = isEn ? 'Likely accurate' : 'Troligen rätt';
	json.learning.sourceReceipt = isEn ? 'From your receipt' : 'Från kvittot';

	json.ai ??= {};
	json.ai.loadingReceiptExtract = isEn ? 'Reading receipt lines…' : 'Läser kvittorader…';
	json.ai.loadingReceiptBbf = isEn ? 'Estimating best-before dates…' : 'Uppskattar bäst-före-datum…';

	json.brain = {
		score: {
			new: isEn ? 'Getting started' : 'Kom igång',
			growing: isEn ? 'Learning your household' : 'Lär känna ert hushåll',
			strong: isEn ? 'Knows your pantry well' : 'Känner ert skafferi'
		},
		homeCard: {
			score: isEn ? 'Household memory · {score}%' : 'Hushållsminne · {score}%',
			scoreAria: isEn ? 'Household memory score {score} percent' : 'Hushållsminne {score} procent',
			body: isEn
				? 'Skaffu learns from receipts and your corrections.'
				: 'Skaffu lär sig av kvitton och era korrigeringar.'
		},
		insights: {
			title: isEn ? 'Pantry insights' : 'Skafferikoll',
			missingExpiry: isEn ? 'Items without a date' : 'Varor utan datum',
			estimatedCount: isEn ? 'Estimated dates' : 'Uppskattade datum'
		},
		receiptQuality: {
			lead: isEn ? '{percent}% of lines got a best-before date' : '{percent}% av raderna fick bäst-före-datum',
			highConfidence: isEn ? '{count} high confidence' : '{count} hög säkerhet',
			estimated: isEn ? '{count} estimated' : '{count} uppskattade',
			missing: isEn ? '{count} missing' : '{count} saknas'
		},
		aiUsage: {
			footer: isEn
				? 'AI helped with {shelfLife} dates and {location} locations ({low} uncertain).'
				: 'AI hjälpte med {shelfLife} datum och {location} platser ({low} osäkra).'
		},
		parseStep: {
			aria: isEn ? 'Receipt parsing progress' : 'Kvittoanalys',
			extract: isEn ? 'Extract' : 'Extrahera',
			classify: isEn ? 'Classify' : 'Klassificera',
			predict: isEn ? 'Predict' : 'Förutsäg'
		},
		uncertainWarning: isEn
			? 'Some estimates are uncertain — review dates before saving.'
			: 'Vissa uppskattningar är osäkra — granska datum innan du sparar.'
	};

	json.settings ??= {};
	json.settings.suggestions ??= {};
	json.settings.suggestions.memoryExplainer = isEn
		? 'Rules here come from receipts and your edits. Reset a rule if Skaffu got it wrong.'
		: 'Regler här kommer från kvitton och era ändringar. Återställ en regel om Skaffu missade.';

	json.receiptImport ??= {};
	json.receiptImport.success ??= {};
	json.receiptImport.success.brainStats = isEn
		? 'Skaffu estimated {estimated} dates and suggested {location} locations.'
		: 'Skaffu uppskattade {estimated} datum och föreslog {location} platser.';

	writeFileSync(full, `${JSON.stringify(json, null, '\t')}\n`, 'utf8');
	console.log('patched i18n', localeFile);
}

// ── pantry-shelf ─────────────────────────────────────────────────────────────

patch('src/lib/domain/pantry-shelf.ts', [
	[
		"import { EXPIRING_SOON_DAYS, daysUntilExpiry } from '$lib/domain/expiry';",
		`import type { ExpiresOnSource } from '$lib/domain/auto-expired';
import { EXPIRING_SOON_DAYS, daysUntilExpiry } from '$lib/domain/expiry';`
	],
	[
		'\texpiresOn: string | null;\n\tquantity: string;',
		'\texpiresOn: string | null;\n\texpiresOnSource: ExpiresOnSource | null;\n\tquantity: string;'
	],
	[
		'\t\tquantity: item.quantity,\n\t\tunit: item.unit,\n\t\t...detail',
		'\t\tquantity: item.quantity,\n\t\tunit: item.unit,\n\t\texpiresOnSource: item.expiresOnSource,\n\t\t...detail'
	]
]);

// ── MissingExpiryFilterChip ──────────────────────────────────────────────────

write(
	'src/lib/components/molecules/MissingExpiryFilterChip.svelte',
	`<script lang="ts">
	import { t } from '$lib/i18n';

	interface Props {
		count: number;
		href: string;
		active?: boolean;
		onSelect?: () => void;
		actionHref?: string | null;
		actionLabel?: string | null;
	}

	let { count, href, active = false, onSelect, actionHref = null, actionLabel = null }: Props = $props();

	function handleClick(event: MouseEvent) {
		if (onSelect) {
			event.preventDefault();
			onSelect();
		}
	}
</script>

{#if count > 0}
	<div class="missing-expiry-wrap">
		<a
			class="missing-expiry-chip"
			class:missing-expiry-chip--active={active}
			{href}
			data-testid="inventory-no-expiry-chip"
			aria-current={active ? 'true' : undefined}
			onclick={handleClick}
		>
			{t('inventory.noExpiryFilterChip', { count })}
		</a>
		{#if actionHref && actionLabel}
			<a class="missing-expiry-action" href={actionHref} data-testid="inventory-no-expiry-bulk-link">
				{actionLabel}
			</a>
		{/if}
	</div>
{/if}

<style>
	.missing-expiry-wrap {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.missing-expiry-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: var(--touch-target-min);
		padding: 0 var(--space-md);
		border: 1px solid color-mix(in srgb, var(--color-text-muted) 35%, var(--color-border));
		border-radius: var(--radius-full, 999px);
		background: color-mix(in srgb, var(--color-text-muted) 8%, var(--color-surface));
		color: var(--color-text);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
	}

	.missing-expiry-action {
		font-size: 0.8125rem;
		font-weight: 600;
	}

	.missing-expiry-chip--active {
		border-color: color-mix(in srgb, var(--color-primary) 40%, var(--color-border));
		background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface));
		color: var(--color-primary);
	}

	.missing-expiry-chip:focus-visible,
	.missing-expiry-action:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
`
);

// ── AiLoadingSkeleton ──────────────────────────────────────────────────────────

patch('src/lib/components/molecules/AiLoadingSkeleton.svelte', [
	[
		"\t\tmessageKey?: 'ai.loadingPantry' | 'ai.loadingWeekly';",
		"\t\tmessageKey?: 'ai.loadingPantry' | 'ai.loadingWeekly' | 'ai.loadingReceiptExtract' | 'ai.loadingReceiptBbf';"
	]
]);

// ── ProductTile ────────────────────────────────────────────────────────────────

patch('src/lib/components/atoms/ProductTile.svelte', [
	[
		"\timport { getLocale, t } from '$lib/i18n';",
		`import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
\timport { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';
\timport { getLocale, t } from '$lib/i18n';`
	],
	[
		'\t{#if detailLine}\n\t\t<span class="tile-detail"',
		`{#if tile.expiresOnSource && isEstimatedExpirySource(tile.expiresOnSource)}
\t\t<EstimatedBadge source={tile.expiresOnSource} interactive={false} />
\t{/if}
\t{#if detailLine}
\t\t<span class="tile-detail"`
	]
]);

// ── ItemRow ───────────────────────────────────────────────────────────────────

patch('src/lib/components/molecules/ItemRow.svelte', [
	[
		"\timport Badge from '$lib/components/atoms/Badge.svelte';",
		`import Badge from '$lib/components/atoms/Badge.svelte';
\timport EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';`
	],
	[
		`\t\t\t\t{#if item.expiresOnSource === 'ai_inferred' && !autoExpired}
\t\t\t\t\t<Badge tone="default">{t('learning.estimatedExpiry')}</Badge>
\t\t\t\t{/if}`,
		`\t\t\t\t{#if item.expiresOnSource === 'ai_inferred' && !autoExpired}
\t\t\t\t\t<EstimatedBadge source={item.expiresOnSource} />
\t\t\t\t{/if}`
	]
]);

// ── EatFirstSection ────────────────────────────────────────────────────────────

patch('src/lib/components/organisms/EatFirstSection.svelte', [
	[
		'\t\t\t\t\t\t<EstimatedBadge source={item.expiresOnSource} />',
		`\t\t\t\t\t\t<EstimatedBadge
\t\t\t\t\t\t\tsource={item.expiresOnSource}
\t\t\t\t\t\t\tlowConfidence={item.expiresOnSource === 'ai_inferred'}
\t\t\t\t\t\t/>`
	]
]);

// ── PantryLocationDataGrid ───────────────────────────────────────────────────

patch('src/lib/components/organisms/PantryLocationDataGrid.svelte', [
	[
		"\timport Badge from '$lib/components/atoms/Badge.svelte';",
		`import Badge from '$lib/components/atoms/Badge.svelte';
\timport EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
\timport { isEstimatedExpirySource } from '$lib/domain/learning/expiry-source';`
	],
	[
		'\tconst missingExpiryHref = $derived(\n\t\tallLocations ? \'/inventory/all?filter=noExpiry\' : `${inventoryPath}?filter=noExpiry`\n\t);',
		`const missingExpiryHref = $derived(
\t\tallLocations ? '/inventory/all?filter=noExpiry' : \`\${inventoryPath}?filter=noExpiry\`
\t);
\tconst bulkExpiryHref = $derived(canWrite ? '/inventory/all?filter=noExpiry' : null);`
	],
	[
		`\t\t\t<MissingExpiryFilterChip
\t\t\t\tcount={missingExpiryCount}
\t\t\t\thref={missingExpiryHref}
\t\t\t\tactive={gridState.filter === 'noExpiry'}
\t\t\t\tonSelect={() => handleFilterChange('noExpiry')}
\t\t\t/>`,
		`<MissingExpiryFilterChip
\t\t\t\tcount={missingExpiryCount}
\t\t\t\thref={missingExpiryHref}
\t\t\t\tactive={gridState.filter === 'noExpiry'}
\t\t\t\tonSelect={() => handleFilterChange('noExpiry')}
\t\t\t\tactionHref={bulkExpiryHref}
\t\t\t\tactionLabel={canWrite ? t('inventory.bulkExpiryAction') : null}
\t\t\t/>`
	],
	[
		`\t\t\t\t\t\t{#if item.expiresOn}
\t\t\t\t\t\t\t<Badge tone={expiryTone(item.expiresOn)}>
\t\t\t\t\t\t\t\t{formatExpiryDate(item.expiresOn, getLocale())}
\t\t\t\t\t\t\t</Badge>`,
		`{#if item.expiresOn}
\t\t\t\t\t\t\t<div class="expiry-cell">
\t\t\t\t\t\t\t\t<Badge tone={expiryTone(item.expiresOn)}>
\t\t\t\t\t\t\t\t\t{formatExpiryDate(item.expiresOn, getLocale())}
\t\t\t\t\t\t\t\t</Badge>
\t\t\t\t\t\t\t\t{#if isEstimatedExpirySource(item.expiresOnSource)}
\t\t\t\t\t\t\t\t\t<EstimatedBadge source={item.expiresOnSource} />
\t\t\t\t\t\t\t\t{/if}
\t\t\t\t\t\t\t</div>`
	]
]);

patch('src/lib/components/organisms/PantryLocationDataGrid.svelte', [
	[
		'\t:global(.missing-expiry-badge .badge) {',
		`.expiry-cell {
\t\tdisplay: inline-flex;
\t\tflex-wrap: wrap;
\t\talign-items: center;
\t\tgap: var(--space-xs);
\t}

\t:global(.missing-expiry-badge .badge) {`
	]
]);

// ── PantryV2Page ──────────────────────────────────────────────────────────────

patch('src/lib/components/organisms/PantryV2Page.svelte', [
	[
		"\timport PantryV2ShelfView from '$lib/components/organisms/PantryV2ShelfView.svelte';",
		`import InventoryInsightsPanel from '$lib/components/organisms/InventoryInsightsPanel.svelte';
\timport PantryV2ShelfView from '$lib/components/organisms/PantryV2ShelfView.svelte';`
	],
	[
		"\tconst missingExpiryHref = '/inventory/all?filter=noExpiry';",
		`const missingExpiryHref = '/inventory/all?filter=noExpiry';
\tconst bulkExpiryHref = '/inventory/all?filter=noExpiry';`
	],
	[
		`\t\t<MissingExpiryFilterChip count={missingExpiryCount} href={missingExpiryHref} />
\t{/if}

\t{#if loadFailed}`,
		`<MissingExpiryFilterChip
\t\t\tcount={missingExpiryCount}
\t\t\thref={missingExpiryHref}
\t\t\tactionHref={canWrite ? bulkExpiryHref : null}
\t\t\tactionLabel={canWrite ? t('inventory.bulkExpiryAction') : null}
\t\t/>
\t{/if}

\t{#if !loadFailed && !showHouseholdEmpty}
\t\t<InventoryInsightsPanel items={items} {canWrite} bulkExpiryHref={canWrite ? bulkExpiryHref : null} />
\t{/if}

\t{#if loadFailed}`
	],
	[
		`\t{/if}

\t{#if loadFailed}`,
		''
	]
]);

// ── SuggestionsSettingsPanel ─────────────────────────────────────────────────

patch('src/lib/components/organisms/SuggestionsSettingsPanel.svelte', [
	[
		'\t{#if showKivraHint}\n\t\t<p class="hint">{t(\'settings.suggestions.kivraHint\')}</p>\n\t{/if}',
		`<p class="hint memory-explainer">{t('settings.suggestions.memoryExplainer')}</p>
\t{#if showKivraHint}
\t\t<p class="hint">{t('settings.suggestions.kivraHint')}</p>
\t{/if}`
	]
]);

// ── ReceiptImportSuccessMoment ───────────────────────────────────────────────

patch('src/lib/components/organisms/ReceiptImportSuccessMoment.svelte', [
	[
		'\t\t\t{#if session.estimatedExpiryCount > 0}\n\t\t\t\t<p class="expiry-line">{t(\'receiptImport.success.estimatedExpiry\', { count: session.estimatedExpiryCount })}</p>\n\t\t\t{/if}',
		`{#if session.estimatedExpiryCount > 0}
\t\t\t\t<p class="expiry-line">{t('receiptImport.success.estimatedExpiry', { count: session.estimatedExpiryCount })}</p>
\t\t\t{/if}
\t\t\t{#if session.brainStats && (session.brainStats.estimatedDates > 0 || session.brainStats.locationSuggestions > 0)}
\t\t\t\t<p class="expiry-line">{t('receiptImport.success.brainStats', {
\t\t\t\t\testimated: session.brainStats.estimatedDates,
\t\t\t\t\tlocation: session.brainStats.locationSuggestions
\t\t\t\t})}</p>
\t\t\t{/if}`
	]
]);

// ── hem +page.server ──────────────────────────────────────────────────────────

patch('src/routes/(app)/hem/+page.server.ts', [
	[
		"import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';",
		`import { getSnapshot as getBrainScoreSnapshot, type BrainScoreSnapshot } from '$lib/domain/brain-score';
import { isShelfLifeLearningEnabled } from '$lib/server/shelf-life-learning-flag';
import { purchasePatternRepository } from '$lib/server/di';`
	],
	[
		'\t\tbriefingFunFact = await impactPromise;\n\t}\n\n\treturn {',
		`\t\tbriefingFunFact = await impactPromise;
\t}

\tlet brainScore: BrainScoreSnapshot | null = null;
\tif (isShelfLifeLearningEnabled()) {
\t\ttry {
\t\t\tconst [suggestions, receiptLineCount] = await Promise.all([
\t\t\t\tlocals.householdSuggestionsService.getSnapshot(householdId),
\t\t\t\tpurchasePatternRepository.countReceiptLines(householdId)
\t\t\t]);
\t\t\tconst ruleCount =
\t\t\t\tsuggestions.shelfLifeRules.length + suggestions.locationRules.length;
\t\t\tconst feedbackCount =
\t\t\t\tsuggestions.shelfLifeRules.reduce((sum, rule) => sum + rule.sampleCount, 0) +
\t\t\t\tsuggestions.locationRules.reduce((sum, rule) => sum + rule.sampleCount, 0);
\t\t\tbrainScore = getBrainScoreSnapshot({ ruleCount, feedbackCount, receiptLineCount });
\t\t} catch (error) {
\t\t\tconsole.warn('[hem] brain score degraded:', error);
\t\t}
\t}

\treturn {`
	],
	[
		'\t\tshowMemoryExplorer: isShelfLifeLearningEnabled()\n\t};',
		'\t\tshowMemoryExplorer: isShelfLifeLearningEnabled(),\n\t\tbrainScore\n\t};'
	]
]);

// ── hem +page.svelte ──────────────────────────────────────────────────────────

patch('src/routes/(app)/hem/+page.svelte', [
	[
		'\t\t\t\tloadFailed={Boolean(data.loadFailed)}\n\n\t\t\t/>',
		`\t\t\t\tloadFailed={Boolean(data.loadFailed)}
\t\t\t\tbrainScore={data.brainScore}
\t\t\t\tbrainFeedbackV1={Boolean(data.brainFeedbackV1Enabled)}
\t\t\t/>`
	]
]);

// ── HomeV2Page ─────────────────────────────────────────────────────────────────

patch('src/lib/components/organisms/HomeV2Page.svelte', [
	[
		"\timport HomeV2BriefingView from '$lib/components/organisms/HomeV2BriefingView.svelte';",
		`import BrainHomeCard from '$lib/components/molecules/BrainHomeCard.svelte';
\timport ReplenishmentSection from '$lib/components/organisms/ReplenishmentSection.svelte';
\timport HomeV2BriefingView from '$lib/components/organisms/HomeV2BriefingView.svelte';
\timport type { BrainScoreSnapshot } from '$lib/domain/brain-score';`
	],
	[
		'\t\tloadFailed?: boolean;\n\t}',
		`\t\tloadFailed?: boolean;
\t\tbrainScore?: BrainScoreSnapshot | null;
\t\tbrainFeedbackV1?: boolean;
\t}`
	],
	[
		'\t\tloadFailed = false\n\t}: Props = $props();',
		`\t\tloadFailed = false,
\t\tbrainScore = null,
\t\tbrainFeedbackV1 = false
\t}: Props = $props();`
	],
	[
		'\t{:else}\n\t\t<HomeV2BriefingView',
		`{:else}
\t\t{#if brainScore && brainScore.score > 0}
\t\t\t<BrainHomeCard snapshot={brainScore} />
\t\t{/if}
\t\t{#if intelligence.replenishment.length > 1}
\t\t\t<ReplenishmentSection
\t\t\t\tsuggestions={intelligence.replenishment.slice(1)}
\t\t\t\tdedupeByKey={intelligence.dedupeByKey}
\t\t\t\tcanEdit={canWrite}
\t\t\t\tsurface="hem"
\t\t\t\tcompact
\t\t\t\tbrainFeedbackV1={brainFeedbackV1}
\t\t\t/>
\t\t{/if}
\t\t<HomeV2BriefingView`
	]
]);

// ── PhotoRoundFlow ────────────────────────────────────────────────────────────

patch('src/lib/components/organisms/PhotoRoundFlow.svelte', [
	[
		"\timport Badge from '$lib/components/atoms/Badge.svelte';",
		`import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
\timport AiLoadingSkeleton from '$lib/components/molecules/AiLoadingSkeleton.svelte';
\timport BrainAiUsageFooter from '$lib/components/molecules/BrainAiUsageFooter.svelte';
\timport { aggregateBrainAiUsageFromPredictions, emptyBrainAiUsageCounts } from '$lib/domain/brain-ai-usage';
\timport type { ExpiresOnSource } from '$lib/domain/auto-expired';
\timport Badge from '$lib/components/atoms/Badge.svelte';`
	],
	[
		'\t\texpiresOnAiInferred: boolean;\n\t};',
		'\t\texpiresOnAiInferred: boolean;\n\t\texpiresOnSource: ExpiresOnSource | null;\n\t};'
	],
	[
		'\t\treturn {\n\t\t\t...item,\n\t\t\tid,\n\t\t\texpiresOn: expiresOn || null,\n\t\t\tnotes: item.notes ?? null,\n\t\t\texpiresOnAiInferred\n\t\t};',
		'\t\treturn {\n\t\t\t...item,\n\t\t\tid,\n\t\t\texpiresOn: expiresOn || null,\n\t\t\tnotes: item.notes ?? null,\n\t\t\texpiresOnAiInferred,\n\t\t\texpiresOnSource: expiresOnAiInferred ? \'ai_inferred\' : item.expiresOn ? \'user_set\' : null\n\t\t};'
	],
	[
		'\tlet showFewItemsHint = $state(false);',
		`let showFewItemsHint = $state(false);
\tconst photoRoundAiUsage = $derived.by(() => {
\t\tconst shelf = lines
\t\t\t.filter((line) => line.expiresOnAiInferred)
\t\t\t.map((line) =>
\t\t\t\tline.expiresOn
\t\t\t\t\t? {
\t\t\t\t\t\t\texpiresOn: line.expiresOn,
\t\t\t\t\t\t\ttypicalDays: 0,
\t\t\t\t\t\t\texpiresOnSource: 'ai_inferred' as const,
\t\t\t\t\t\t\tmodelVersion: 'photo-round'
\t\t\t\t\t\t}
\t\t\t\t\t: null
\t\t\t);
\t\treturn aggregateBrainAiUsageFromPredictions(shelf, []);
\t});`
	],
	[
		'\t\t{#if parseError}\n\t\t\t<div data-testid="photo-round-parse-error">',
		`{#if parsing}
\t\t\t<AiLoadingSkeleton messageKey="ai.loadingReceiptExtract" />
\t\t{/if}

\t\t{#if parseError}
\t\t\t<div data-testid="photo-round-parse-error">`
	],
	[
		'\t\t\t\t\t\t{#if line.expiresOnAiInferred && line.expiresOn}\n\t\t\t\t\t\t\t<Badge tone="default">{t(\'learning.estimatedExpiry\')}</Badge>\n\t\t\t\t\t\t{/if}',
		`{#if line.expiresOnSource && line.expiresOn}
\t\t\t\t\t\t\t<EstimatedBadge
\t\t\t\t\t\t\t\tsource={line.expiresOnSource}
\t\t\t\t\t\t\t\tlowConfidence={line.confidence === 'low'}
\t\t\t\t\t\t\t/>
\t\t\t\t\t\t{/if}`
	],
	[
		'\t\t\t</ul>\n\n\t\t\t<div class="actions">',
		`</ul>

\t\t\t<BrainAiUsageFooter counts={photoRoundAiUsage} />

\t\t\t<div class="actions">`
	]
]);

// ── ReceiptBulkAddFlow ────────────────────────────────────────────────────────

patch('src/lib/components/organisms/ReceiptBulkAddFlow.svelte', [
	[
		"\timport EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';",
		`import EstimatedBadge from '$lib/components/molecules/EstimatedBadge.svelte';
\timport AiLoadingSkeleton from '$lib/components/molecules/AiLoadingSkeleton.svelte';
\timport BrainAiUsageFooter from '$lib/components/molecules/BrainAiUsageFooter.svelte';
\timport ReceiptParseStepIndicator from '$lib/components/molecules/ReceiptParseStepIndicator.svelte';
\timport ReceiptQualityMeter from '$lib/components/molecules/ReceiptQualityMeter.svelte';
\timport { buildReceiptImportQualityReport } from '$lib/domain/receipt-quality-report';
\timport {
\t\taggregateBrainAiUsageFromPredictions,
\t\temptyBrainAiUsageCounts
\t} from '$lib/domain/brain-ai-usage';`
	],
	[
		'\taggregateReceiptImportSummary,\n\t\taggregateReceiptLocationCounts,\n\t\tmarkReceiptImportCompleted',
		'aggregateReceiptBrainStats,\n\t\taggregateReceiptImportSummary,\n\t\taggregateReceiptLocationCounts,\n\t\tmarkReceiptImportCompleted'
	],
	[
		'\tlet quickConfirmUsed = $state(false);',
		`let quickConfirmUsed = $state(false);
\tlet qualityReport = $state<import('$lib/domain/receipt-quality-report').ReceiptImportQualityReport | null>(null);
\tlet parseStep = $state<'extract' | 'classify' | 'predict'>('extract');`
	],
	[
		'\t\tlocationPredictions = data.locationPredictions ?? [];',
		'\t\tlocationPredictions = data.locationPredictions ?? [];\n\t\tqualityReport = buildReceiptImportQualityReport(data.lines, data.shelfLifePredictions);'
	],
	[
		'\t\tparsing = true;\n\t\tparseError = null;',
		'parsing = true;\n\t\tparseError = null;\n\t\tparseStep = \'extract\';'
	],
	[
		'\t\t\tconst response = await fetch(\'/api/receipt/parse\', { method: \'POST\', body: formData });',
		`parseStep = 'classify';
\t\t\tconst response = await fetch('/api/receipt/parse', { method: 'POST', body: formData });
\t\t\tparseStep = 'predict';`
	],
	[
		'\tconst hasLocationPredictions = $derived(locationPredictions.some((prediction) => prediction != null));',
		`const hasLocationPredictions = $derived(locationPredictions.some((prediction) => prediction != null));
\tconst receiptAiUsage = $derived(
\t\taggregateBrainAiUsageFromPredictions(shelfLifePredictions, locationPredictions)
\t);
\tconst hasUncertainEstimates = $derived(receiptAiUsage.lowConfidence > 0);`
	],
	[
		'\t\t{#if parsing}\n\t\t\t<FeedbackBanner\n\t\t\t\ttone="info"\n\t\t\t\tmessage={t(\'receipt.readingStatus\')}\n\t\t\t/>\n\t\t{/if}',
		`{#if parsing}
\t\t\t<ReceiptParseStepIndicator step={parseStep} />
\t\t\t<AiLoadingSkeleton messageKey={parseStep === 'predict' ? 'ai.loadingReceiptBbf' : 'ai.loadingReceiptExtract'} />
\t\t{/if}`
	],
	[
		'\t\t{#if hasLocationPredictions}\n\t\t\t<p class="hint">{t(\'receiptBulk.locationSuggestionsHint\')}</p>\n\t\t{/if}',
		`{#if hasLocationPredictions}
\t\t\t<p class="hint">{t('receiptBulk.locationSuggestionsHint')}</p>
\t\t{/if}
\t\t{#if qualityReport && shelfLifeEstimatesInReceipt}
\t\t\t<ReceiptQualityMeter report={qualityReport} />
\t\t{/if}
\t\t{#if hasUncertainEstimates}
\t\t\t<p class="hint uncertain-hint">{t('brain.uncertainWarning')}</p>
\t\t{/if}`
	],
	[
		'\t\t\t\t\t\t\t{#if locationPredictions[index] && !locationOverrides.has(index)}\n\t\t\t\t\t\t\t\t<EstimatedBadge\n\t\t\t\t\t\t\t\t\tsource={locationPredictions[index]!.source}\n\t\t\t\t\t\t\t\t\tlabel={t(\'receiptBulk.suggestedLocation\')}\n\t\t\t\t\t\t\t\t/>',
		`{#if locationPredictions[index] && !locationOverrides.has(index)}
\t\t\t\t\t\t\t\t<EstimatedBadge
\t\t\t\t\t\t\t\t\tsource={locationPredictions[index]!.source}
\t\t\t\t\t\t\t\t\tlabel={t('receiptBulk.suggestedLocation')}
\t\t\t\t\t\t\t\t\texplanation={locationPredictions[index]!.explanation}
\t\t\t\t\t\t\t\t/>`
	],
	[
		'\t\t\t\t\t{#if shelfLifeEstimatesInReceipt && selected[index]}\n\t\t\t\t\t\t<div class="line-expiry">',
		`{#if shelfLifeEstimatesInReceipt && selected[index]}
\t\t\t\t\t\t<div class="line-expiry" style="animation-delay: {(index % 5) * 60}ms">`
	],
	[
		'\t\t\t\t\t\t\t\t\t\t\tlowConfidence={isLowConfidence(shelfLifePredictions[index])}\n\t\t\t\t\t\t\t\t\t\t\tshowSettingsLink',
		`lowConfidence={isLowConfidence(shelfLifePredictions[index])}
\t\t\t\t\t\t\t\t\t\t\tlineConfidence={shelfLifePredictions[index]!.confidence ?? null}
\t\t\t\t\t\t\t\t\t\t\tshowSettingsLink`
	],
	[
		'\t\t\t</ul>\n\n\t\t\t<div class="actions">',
		`</ul>

\t\t\t<BrainAiUsageFooter counts={receiptAiUsage} />

\t\t\t<div class="actions">`
	],
	[
		'\t\t\t\t\t\tmarkReceiptImportCompleted(\n\t\t\t\t\t\t\tselectedCount,\n\t\t\t\t\t\t\tbuildReceiptImportSummary(),\n\t\t\t\t\t\t\taggregateReceiptLocationCounts(buildReceiptLineContexts()),\n\t\t\t\t\t\t\tcountSelectedLinesWithPrice(),\n\t\t\t\t\t\t\timportSource\n\t\t\t\t\t\t);',
		`markReceiptImportCompleted(
\t\t\t\t\t\t\tselectedCount,
\t\t\t\t\t\t\tbuildReceiptImportSummary(),
\t\t\t\t\t\t\taggregateReceiptLocationCounts(buildReceiptLineContexts()),
\t\t\t\t\t\t\tcountSelectedLinesWithPrice(),
\t\t\t\t\t\t\timportSource,
\t\t\t\t\t\t\taggregateReceiptBrainStats(buildReceiptLineContexts(), qualityReport ?? undefined)
\t\t\t\t\t\t);`
	]
]);

console.log('Brain UI complete.');
