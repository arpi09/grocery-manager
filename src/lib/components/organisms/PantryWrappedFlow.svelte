<script lang="ts">
	import { browser } from '$app/environment';
	import Button from '$lib/components/atoms/Button.svelte';
	import GamificationIllustration from '$lib/components/atoms/GamificationIllustration.svelte';
	import WrappedShareCard from '$lib/components/molecules/WrappedShareCard.svelte';
	import { getMilestoneRegistryEntry } from '$lib/domain/gamification.registry';
	import type { WrappedReportData, WrappedSlide } from '$lib/domain/wrapped';
	import { t } from '$lib/i18n';
	import {
		downloadBlob,
		renderWrappedShareCardPng,
		type WrappedShareExportLabels
	} from '$lib/utils/wrapped-share-export';

	interface Props {
		report: WrappedReportData;
		monthLabel: string;
	}

	let { report, monthLabel }: Props = $props();

	let activeIndex = $state(0);
	let viewedTracked = $state(false);
	let sharing = $state(false);
	let slideTitleEl = $state<HTMLHeadingElement | undefined>(undefined);

	const slides = $derived(report.slides);
	const activeSlide = $derived(slides[activeIndex] as WrappedSlide | undefined);
	const isShareSlide = $derived(activeSlide?.id === 'share');
	const isLastSlide = $derived(activeIndex >= slides.length - 1);

	const savingsSek = $derived(
		report.monthlySavings.savedSek > 0
			? report.monthlySavings.savedSek
			: report.lifetimeSavedSek
	);
	const savingsKg = $derived(report.monthlySavings.savedKg);

	function slideTitle(slide: WrappedSlide): string {
		switch (slide.id) {
			case 'intro':
				return report.isFirstMonth
					? t('wrapped.slideIntroFirstTitle')
					: t('wrapped.slideIntroTitle', { month: monthLabel });
			case 'savings':
				return t('wrapped.slideSavingsTitle', { sek: savingsSek, kg: savingsKg });
			case 'topProduct':
				return t('wrapped.slideTopProductTitle');
			case 'streak':
				return t('wrapped.slideStreakTitle', { count: report.zeroWasteWeeks ?? 0 });
			case 'milestones':
				return t('wrapped.slideMilestonesTitle', {
					count: report.achievedMilestones.length
				});
			case 'share':
				return t('wrapped.slideShareTitle');
			default:
				return '';
		}
	}

	function slideBody(slide: WrappedSlide): string {
		switch (slide.id) {
			case 'intro':
				return report.isFirstMonth
					? t('wrapped.slideIntroFirstBody')
					: t('wrapped.slideIntroBody', { month: monthLabel });
			case 'savings':
				return report.monthlySavings.hasData
					? t('wrapped.slideSavingsBodyMonth')
					: t('wrapped.slideSavingsBodyLifetime');
			case 'topProduct':
				return t('wrapped.slideTopProductBody', { product: report.topProduct ?? '' });
			case 'streak':
				return t('wrapped.slideStreakBody');
			case 'milestones': {
				const labels = report.achievedMilestones
					.slice(0, 3)
					.map((id) => {
						const entry = getMilestoneRegistryEntry(id);
						return entry ? t(entry.i18nKey) : id;
					});
				return labels.length > 0
					? labels.join(' · ')
					: t('wrapped.slideMilestonesBody');
			}
			case 'share':
				return t('wrapped.slideShareBody');
			default:
				return '';
		}
	}

	function shareLabels(): WrappedShareExportLabels {
		const sek =
			report.monthlySavings.savedSek > 0
				? report.monthlySavings.savedSek
				: report.lifetimeSavedSek;
		return {
			brand: t('nav.brandName'),
			monthLabel,
			headline: t('wrapped.shareCardHeadline', { sek, kg: report.monthlySavings.savedKg }),
			statsLine: report.topProduct
				? t('wrapped.shareCardTopProduct', { product: report.topProduct })
				: report.zeroWasteWeeks
					? t('wrapped.shareCardStreak', { count: report.zeroWasteWeeks ?? 0 })
					: t('wrapped.shareCardConsumed', { count: report.consumedThisMonth }),
			footer: t('wrapped.shareCardFooter')
		};
	}

	async function trackEvent(
		eventType: 'wrapped_viewed' | 'wrapped_shared',
		metadata: Record<string, unknown>
	): Promise<void> {
		try {
			await fetch('/api/product-events', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ eventType, metadata })
			});
		} catch {
			// best-effort
		}
	}

	$effect(() => {
		if (!browser || viewedTracked) {
			return;
		}
		viewedTracked = true;
		void trackEvent('wrapped_viewed', {
			month: report.monthKey,
			slideCount: slides.length
		});
	});

	$effect(() => {
		if (!browser) {
			return;
		}
		void activeIndex;
		slideTitleEl?.focus({ preventScroll: true });
	});

	function goNext() {
		if (!isLastSlide) {
			activeIndex += 1;
		}
	}

	function goPrev() {
		if (activeIndex > 0) {
			activeIndex -= 1;
		}
	}

	async function exportPng(method: 'share' | 'download') {
		if (!browser || sharing) {
			return;
		}
		sharing = true;
		try {
			const blob = await renderWrappedShareCardPng(shareLabels());
			const filename = `skaffu-wrapped-${report.monthKey}.png`;

			if (method === 'share' && navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: 'image/png' })] })) {
				const file = new File([blob], filename, { type: 'image/png' });
				await navigator.share({
					title: t('wrapped.shareTitle'),
					text: t('wrapped.shareText'),
					files: [file]
				});
			} else if (method === 'share' && navigator.share) {
				await navigator.share({
					title: t('wrapped.shareTitle'),
					text: t('wrapped.shareTextWithStats', {
						sek: savingsSek,
						kg: savingsKg
					}),
					url: window.location.origin
				});
			} else {
				downloadBlob(blob, filename);
			}

			await trackEvent('wrapped_shared', { month: report.monthKey, method });
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}
			const blob = await renderWrappedShareCardPng(shareLabels());
			downloadBlob(blob, `skaffu-wrapped-${report.monthKey}.png`);
			await trackEvent('wrapped_shared', { month: report.monthKey, method: 'download' });
		} finally {
			sharing = false;
		}
	}
</script>

<section class="wrapped-flow" aria-label={t('wrapped.flowAria')} data-testid="wrapped-flow">
	<div
		class="progress"
		role="tablist"
		aria-label={t('wrapped.progressAria', { current: activeIndex + 1, total: slides.length })}
	>
		{#each slides as slide, index (slide.id)}
			<span
				class="dot"
				class:active={index === activeIndex}
				class:done={index < activeIndex}
				role="tab"
				aria-selected={index === activeIndex}
				aria-label={t('wrapped.progressDot', { current: index + 1, total: slides.length })}
			></span>
		{/each}
	</div>

	{#if activeSlide}
		<article class="slide" class:share-slide={isShareSlide} aria-live="polite">
			{#if !isShareSlide}
				<div class="slide-visual" aria-hidden="true">
					<GamificationIllustration variant={activeSlide.illustration} size={130} />
				</div>
				<h2
					class="slide-title"
					class:first-month={report.isFirstMonth && activeSlide.id === 'intro'}
					tabindex="-1"
					bind:this={slideTitleEl}
					data-testid="wrapped-slide-title"
				>
					{slideTitle(activeSlide)}
				</h2>
				<p class="slide-body" class:first-month={report.isFirstMonth && activeSlide.id === 'intro'}>
					{slideBody(activeSlide)}
				</p>
			{:else}
				<WrappedShareCard {report} {monthLabel} />
				<p class="share-hint">{t('wrapped.slideShareBody')}</p>
				<div class="share-actions">
					{#if browser && typeof navigator !== 'undefined' && 'share' in navigator}
						<Button type="button" onclick={() => exportPng('share')} loading={sharing}>
							{t('wrapped.shareCta')}
						</Button>
					{/if}
					<Button
						type="button"
						variant="secondary"
						onclick={() => exportPng('download')}
						loading={sharing}
					>
						{t('wrapped.downloadCta')}
					</Button>
				</div>
			{/if}
		</article>
	{/if}

	<div class="nav-row">
		<Button type="button" variant="secondary" onclick={goPrev} disabled={activeIndex === 0}>
			{t('wrapped.prev')}
		</Button>
		{#if !isShareSlide}
			<Button type="button" onclick={goNext} disabled={isLastSlide}>
				{t('wrapped.next')}
			</Button>
		{:else}
			<a class="back-link" href="/statistik">{t('wrapped.backToStats')}</a>
		{/if}
	</div>
</section>

<style>
	.wrapped-flow {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
		width: 100%;
		max-width: 28rem;
		min-width: 0;
		margin: 0 auto;
	}

	.progress {
		display: flex;
		gap: 0.35rem;
		justify-content: center;
	}

	.dot {
		width: 2rem;
		height: 0.25rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
		transition: background 0.2s ease, transform 0.2s ease;
	}

	.dot.active {
		background: var(--color-primary);
		transform: scaleY(1.4);
	}

	.dot.done {
		background: color-mix(in srgb, var(--color-primary) 55%, var(--color-border));
	}

	.slide {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: var(--space-md);
		min-height: 24rem;
		padding: var(--space-md);
		border-radius: var(--radius-lg);
		background: linear-gradient(
			165deg,
			color-mix(in srgb, var(--color-primary) 6%, var(--color-surface)),
			var(--color-surface)
		);
		border: 1px solid color-mix(in srgb, var(--color-primary) 16%, var(--color-border));
	}

	.slide.share-slide {
		min-height: auto;
	}

	.slide-visual {
		margin-top: var(--space-sm);
	}

	.slide-title {
		margin: 0;
		font-size: 1.5rem;
		font-weight: 800;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	.slide-body {
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-muted);
		max-width: 32ch;
	}

	.slide-title.first-month,
	.slide-body.first-month {
		max-width: 36ch;
	}

	.slide-body.first-month {
		font-size: 1rem;
		color: var(--color-text);
	}

	.share-hint {
		margin: 0;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	.share-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		justify-content: center;
		width: 100%;
	}

	.share-actions :global(.btn) {
		min-width: 0;
	}

	.nav-row {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-sm);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--touch-target-min);
		padding: 0.35rem 0.5rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}

	.back-link:hover {
		color: var(--color-primary-hover);
	}

	@media (max-width: 480px) {
		.slide {
			padding: var(--space-sm);
		}

		.slide-title {
			font-size: 1.25rem;
		}

		.share-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.share-actions :global(.btn) {
			width: 100%;
		}

		.nav-row :global(.btn) {
			flex: 1 1 auto;
			min-width: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dot {
			transition: none;
		}
	}
</style>
