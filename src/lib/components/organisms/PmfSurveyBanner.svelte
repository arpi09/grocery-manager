<script lang="ts">
	import { browser } from '$app/environment';
	import { env as publicEnv } from '$env/dynamic/public';
	import { page } from '$app/state';
	import Button from '$lib/components/atoms/Button.svelte';
	import type { PmfWouldMiss } from '$lib/domain/pmf-survey';
	import { t, type MessageKey } from '$lib/i18n';
	import {
		getBlockingOverlayCount,
		OVERLAY_STACK_CHANGED_EVENT
	} from '$lib/utils/overlay-stack';
	import {
		dismissPmfSurvey,
		markPmfSurveySubmitted,
		resolvePmfSurveyTrigger,
		shouldShowPmfSurvey
	} from '$lib/utils/pmf-survey';

	let open = $state(false);
	let overlayRevision = $state(0);
	let submitting = $state(false);
	let npsScore = $state<number | null>(null);
	let wouldMiss = $state<PmfWouldMiss | null>(null);
	let comment = $state('');

	const pathname = $derived(page.url.pathname);
	const userId = $derived(page.data.user?.id ?? null);

	const canSubmit = $derived(npsScore !== null && wouldMiss !== null && !submitting);

	const wouldMissLabelKeys: Record<PmfWouldMiss, MessageKey> = {
		yes: 'pmfSurvey.wouldMiss.yes',
		somewhat: 'pmfSurvey.wouldMiss.somewhat',
		no: 'pmfSurvey.wouldMiss.no'
	};

	function tryOpenSurvey() {
		if (
			!browser ||
			publicEnv.PUBLIC_E2E_DISABLE_PMF_SURVEY === 'true' ||
			!userId ||
			getBlockingOverlayCount() > 0 ||
			!shouldShowPmfSurvey(userId, pathname)
		) {
			open = false;
			return;
		}
		open = true;
	}

	function dismissSurvey() {
		dismissPmfSurvey(userId);
		resetForm();
		open = false;
	}

	function resetForm() {
		npsScore = null;
		wouldMiss = null;
		comment = '';
	}

	async function submitSurvey() {
		if (!browser || !userId || !canSubmit || npsScore === null || wouldMiss === null) {
			return;
		}

		submitting = true;
		try {
			const response = await fetch('/api/pmf-survey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					trigger: resolvePmfSurveyTrigger(userId),
					npsScore,
					wouldMiss,
					comment: comment.trim() || null
				})
			});

			if (response.ok) {
				markPmfSurveySubmitted(userId);
				resetForm();
				open = false;
			}
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if (!browser) {
			return;
		}

		const onOverlayChange = () => {
			overlayRevision += 1;
		};

		window.addEventListener(OVERLAY_STACK_CHANGED_EVENT, onOverlayChange);
		return () => window.removeEventListener(OVERLAY_STACK_CHANGED_EVENT, onOverlayChange);
	});

	$effect(() => {
		if (!browser) {
			return;
		}

		void pathname;
		void userId;
		void overlayRevision;
		tryOpenSurvey();
	});
</script>

{#if open}
	<div
		class="pmf-survey-banner"
		role="dialog"
		aria-label={t('pmfSurvey.dialogAria')}
		data-testid="pmf-survey-banner"
	>
		<div class="banner-header">
			<div>
				<p class="banner-title">{t('pmfSurvey.title')}</p>
				<p class="banner-lead">{t('pmfSurvey.lead')}</p>
			</div>
			<button
				type="button"
				class="dismiss-btn"
				data-testid="pmf-survey-dismiss"
				onclick={dismissSurvey}
				aria-label={t('pmfSurvey.dismiss')}
			>
				×
			</button>
		</div>

		<fieldset class="question" disabled={submitting}>
			<legend>{t('pmfSurvey.npsQuestion')}</legend>
			<div class="nps-grid" role="group" aria-label={t('pmfSurvey.npsGroupAria')}>
				{#each Array.from({ length: 11 }, (_, index) => index) as score (score)}
					<button
						type="button"
						class="nps-btn"
						class:selected={npsScore === score}
						aria-pressed={npsScore === score}
						onclick={() => (npsScore = score)}
					>
						{score}
					</button>
				{/each}
			</div>
			<p class="nps-hint">
				<span>{t('pmfSurvey.npsLow')}</span>
				<span>{t('pmfSurvey.npsHigh')}</span>
			</p>
		</fieldset>

		<fieldset class="question" disabled={submitting}>
			<legend>{t('pmfSurvey.missQuestion')}</legend>
			<div class="miss-grid" role="group" aria-label={t('pmfSurvey.missGroupAria')}>
				{#each ['yes', 'somewhat', 'no'] as value (value)}
					<button
						type="button"
						class="miss-btn"
						class:selected={wouldMiss === value}
						aria-pressed={wouldMiss === value}
						onclick={() => (wouldMiss = value as PmfWouldMiss)}
					>
						{t(wouldMissLabelKeys[value as PmfWouldMiss])}
					</button>
				{/each}
			</div>
		</fieldset>

		<label class="comment-field">
			<span class="comment-label">{t('pmfSurvey.commentLabel')}</span>
			<textarea
				bind:value={comment}
				rows="2"
				maxlength="500"
				placeholder={t('pmfSurvey.commentPlaceholder')}
				disabled={submitting}
			></textarea>
		</label>

		<div class="actions">
			<Button type="button" variant="ghost" disabled={submitting} onclick={dismissSurvey}>
				{t('pmfSurvey.dismiss')}
			</Button>
			<Button
				type="button"
				disabled={!canSubmit}
				loading={submitting}
				loadingLabel={t('common.saving')}
				onclick={submitSurvey}
			>
				{t('pmfSurvey.submit')}
			</Button>
		</div>
	</div>
{/if}

<style>
	.pmf-survey-banner {
		position: fixed;
		z-index: calc(var(--z-modal) - 3);
		left: var(--space-md);
		right: var(--space-md);
		bottom: calc(var(--content-bottom-safe) + var(--space-sm));
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-lg);
		background: color-mix(in srgb, var(--color-surface) 98%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-primary) 24%, var(--color-border));
		box-shadow: var(--shadow-md);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		animation: pmf-banner-in 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (min-width: 640px) {
		.pmf-survey-banner {
			left: auto;
			right: var(--space-lg);
			max-width: min(26rem, calc(100vw - 2 * var(--space-lg)));
		}
	}

	.banner-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.banner-title {
		margin: 0;
		font-size: var(--font-size-body-sm);
		font-weight: 700;
		color: var(--color-text);
	}

	.banner-lead {
		margin: 0.2rem 0 0;
		font-size: 0.85rem;
		line-height: 1.45;
		color: var(--color-text-muted);
	}

	.dismiss-btn {
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 1.35rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
	}

	.question {
		margin: 0;
		padding: 0;
		border: none;
		min-width: 0;
	}

	.question legend {
		font-size: 0.85rem;
		font-weight: 600;
		margin-bottom: var(--space-xs);
	}

	.nps-grid {
		display: grid;
		grid-template-columns: repeat(11, minmax(0, 1fr));
		gap: 0.2rem;
	}

	.nps-btn,
	.miss-btn {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.35rem 0;
		cursor: pointer;
	}

	.nps-btn.selected,
	.miss-btn.selected {
		border-color: var(--color-primary);
		background: var(--color-primary-soft, rgba(61, 107, 79, 0.12));
		color: var(--color-primary);
	}

	.nps-hint {
		display: flex;
		justify-content: space-between;
		margin: 0.25rem 0 0;
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.miss-grid {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.miss-btn {
		flex: 1 1 30%;
		padding: 0.45rem 0.5rem;
		font-size: 0.8rem;
	}

	.comment-field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.comment-label {
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.comment-field textarea {
		width: 100%;
		padding: 0.5rem 0.65rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
		resize: vertical;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	@keyframes pmf-banner-in {
		from {
			opacity: 0;
			transform: translateY(0.75rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pmf-survey-banner {
			animation: none;
		}
	}
</style>
