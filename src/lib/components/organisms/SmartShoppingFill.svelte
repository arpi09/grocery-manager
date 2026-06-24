<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import LearningAiBadge from '$lib/components/atoms/LearningAiBadge.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';

	interface FillFormResult {
		fillError?: string;
		fillSuccess?: {
			added: number;
			skipped: number;
			note?: string | null;
			suggestions?: Array<{
				name: string;
				relatedMealDate?: string | null;
				relatedRecipeTitle?: string | null;
			}>;
		};
	}

	let {
		canEdit,
		form,
		onFillComplete
	}: {
		canEdit: boolean;
		form: FillFormResult | null | undefined;
		onFillComplete?: (result: { added: number; skipped: number }) => void;
	} = $props();

	let showAdvanced = $state(false);
	let preferences = $state('');
	let householdSize = $state(2);
	let loading = $state(false);
	let celebrate = $state(false);
	let lastHandledFillKey = $state<string | null>(null);

	const FILL_CELEBRATION_THRESHOLD = 15;

	const successMessage = $derived.by(() => {
		const result = form?.fillSuccess;
		if (!result) return null;
		if (result.added === 0 && result.skipped > 0) {
			return t('shopping.fillAllDuplicates', { count: result.skipped });
		}
		if (result.skipped > 0) {
			return t('shopping.fillPartialSuccess', {
				added: result.added,
				skipped: result.skipped
			});
		}
		if (result.added >= FILL_CELEBRATION_THRESHOLD) {
			return t('shopping.fillCelebrationBig', { count: result.added });
		}
		return t('shopping.fillSuccess', { count: result.added });
	});

	const showStickySuccess = $derived(
		!!successMessage && !loading && (form?.fillSuccess?.added ?? 0) > 0
	);

	$effect(() => {
		const result = form?.fillSuccess;
		if (!result || loading) return;
		const key = `${result.added}:${result.skipped}:${result.note ?? ''}`;
		if (key === lastHandledFillKey) return;
		lastHandledFillKey = key;
		if (result.added > 0) {
			celebrate = true;
			onFillComplete?.({ added: result.added, skipped: result.skipped });
			if (browser) {
				const timer = setTimeout(() => {
					celebrate = false;
				}, 1200);
				return () => clearTimeout(timer);
			}
		}
	});
</script>

{#if canEdit}
	<section class="smart-fill" aria-label={t('shopping.smartFillAria')}>
		<p class="intro">{t('shopping.smartFillIntro')}</p>

		<form
			method="POST"
			action="?/fillFromPantry"
			class="fill-form"
			use:enhance={bindSubmitting((value) => (loading = value))}
		>
			<Button
				type="submit"
				fullWidth
				loading={loading}
				loadingLabel={t('shopping.fillLoading')}
				data-analytics-id="shopping.smart_fill"
				data-testid="shopping-smart-fill"
			>
				<span class="fill-btn-inner">
					{t('shopping.fillFromPantry')}
					<LearningAiBadge variant="soft" testId="shopping-smart-fill-ai-badge" />
				</span>
			</Button>

			{#if loading}
				<p class="fill-status" role="status" aria-live="polite">
					{t('shopping.fillLoading')}
				</p>
			{/if}

			<details class="advanced" bind:open={showAdvanced}>
				<summary>{t('shopping.advancedPreferences')}</summary>
				<div class="advanced-body">
					<label class="label" for="fill-preferences">{t('shopping.preferences')}</label>
					<textarea
						id="fill-preferences"
						name="preferences"
						class="textarea"
						rows="2"
						maxlength="300"
						bind:value={preferences}
						placeholder={t('shopping.preferencesPlaceholder')}
					></textarea>

					<label class="label" for="fill-household-size">{t('shopping.householdSizeLabel')}</label>
					<input
						id="fill-household-size"
						name="householdSize"
						class="number-input"
						type="number"
						min="1"
						max="8"
						bind:value={householdSize}
					/>
				</div>
			</details>
		</form>

		{#if form?.fillError}
			<FeedbackBanner tone="error" message={form.fillError} />
		{:else if successMessage}
			{#if showStickySuccess}
				<div
					class="fill-success-banner"
					class:celebrate
					role="status"
					aria-live="polite"
					data-testid="shopping-fill-success"
				>
					{successMessage}
				</div>
			{:else}
				<FeedbackBanner tone="success" message={successMessage} />
			{/if}
			{#if form?.fillSuccess?.note}
				<p class="note">{form.fillSuccess.note}</p>
			{/if}
			{#if form?.fillSuccess?.suggestions?.length}
				<ul class="fill-chips" data-testid="shopping-fill-chips">
					{#each form.fillSuccess.suggestions as suggestion (suggestion.name)}
						<li class="fill-chip">
							<span>{suggestion.name}</span>
							{#if suggestion.relatedMealDate}
								<small>{suggestion.relatedMealDate}</small>
							{/if}
							{#if suggestion.relatedRecipeTitle}
								<small>{suggestion.relatedRecipeTitle}</small>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		{/if}
	</section>
{/if}

<style>
	.smart-fill {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
	}

	.intro,
	.note,
	.fill-status {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.fill-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.fill-chip {
		display: inline-flex;
		flex-direction: column;
		gap: 0.1rem;
		padding: 0.35rem 0.6rem;
		border-radius: var(--radius-full, 999px);
		border: 1px solid var(--color-border);
		font-size: 0.75rem;
		background: var(--color-surface-muted);
	}

	.fill-chip small {
		color: var(--color-text-muted);
	}

	.fill-status {
		text-align: center;
		font-weight: 600;
		color: var(--color-text);
	}

	.fill-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.fill-btn-inner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
	}

	.fill-success-banner {
		position: sticky;
		top: var(--space-sm);
		z-index: 2;
		margin: 0;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-success-muted, color-mix(in srgb, var(--color-success) 12%, var(--color-surface)));
		border: 1px solid color-mix(in srgb, var(--color-success) 35%, var(--color-border));
		color: var(--color-text);
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.4;
		box-shadow: var(--shadow-sm);
	}

	.fill-success-banner.celebrate {
		animation: fill-success-pop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1);
	}

	@keyframes fill-success-pop {
		0% {
			transform: scale(0.96);
			opacity: 0.85;
		}
		45% {
			transform: scale(1.02);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fill-success-banner.celebrate {
			animation: none;
		}
	}

	.advanced {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface-muted);
	}

	.advanced summary {
		cursor: pointer;
		padding: 0.65rem 0.85rem;
		font-weight: 600;
		color: var(--color-text-muted);
	}

	.advanced-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		padding: 0 0.85rem 0.85rem;
	}

	.label {
		font-weight: 600;
	}

	.textarea,
	.number-input {
		width: 100%;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.number-input {
		max-width: 6rem;
	}

	@media (max-width: 640px) {
		.smart-fill {
			padding: var(--space-sm);
		}
	}
</style>
