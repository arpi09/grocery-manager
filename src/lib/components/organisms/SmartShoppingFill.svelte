<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { t } from '$lib/i18n';
	import { bindSubmitting } from '$lib/utils/form-submit-feedback';

	interface FillFormResult {
		fillError?: string;
		fillSuccess?: {
			added: number;
			skipped: number;
			note?: string | null;
		};
	}

	let { canEdit, form }: { canEdit: boolean; form: FillFormResult | null | undefined } = $props();

	let showAdvanced = $state(false);
	let preferences = $state('');
	let householdSize = $state(2);
	let loading = $state(false);

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
		return t('shopping.fillSuccess', { count: result.added });
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
				loadingLabel={t('common.thinking')}
			>
				{t('shopping.fillFromPantry')}
			</Button>

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
			<FeedbackBanner tone="success" message={successMessage} />
			{#if form?.fillSuccess?.note}
				<p class="note">{form.fillSuccess.note}</p>
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
	.note {
		margin: 0;
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.fill-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
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
