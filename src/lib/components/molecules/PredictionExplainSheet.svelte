<script lang="ts">
	import Modal from '$lib/components/molecules/Modal.svelte';
	import Button from '$lib/components/atoms/Button.svelte';
	import type { PredictionExplanation } from '$lib/domain/learning/prediction-trust';
	import { renderExplanationContent } from '$lib/domain/learning/prediction-explain';
	import { showClientToast } from '$lib/utils/client-toast.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		open: boolean;
		explanation: PredictionExplanation | null;
		onClose: () => void;
		showSettingsLink?: boolean;
		/** When set, the sheet offers a one-tap expiry correction for this item. */
		correctionItemId?: string | null;
		correctionExpiresOn?: string | null;
		onCorrected?: (expiresOn: string) => void;
	}

	let {
		open,
		explanation,
		onClose,
		showSettingsLink = false,
		correctionItemId = null,
		correctionExpiresOn = null,
		onCorrected
	}: Props = $props();

	const content = $derived(explanation ? renderExplanationContent(explanation) : null);
	const canCorrect = $derived(Boolean(correctionItemId));

	let editing = $state(false);
	let draftDate = $state('');
	let saving = $state(false);

	// Reset the inline editor whenever the sheet closes or the target item changes.
	$effect(() => {
		if (!open) {
			editing = false;
			saving = false;
		}
	});

	function startCorrection() {
		draftDate = correctionExpiresOn ?? '';
		editing = true;
	}

	async function saveCorrection() {
		if (!correctionItemId || !draftDate || saving) return;
		saving = true;
		try {
			const response = await fetch('/api/inventory/correct-expiry', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ itemId: correctionItemId, expiresOn: draftDate })
			});
			const data = (await response.json().catch(() => null)) as
				| { error?: string; expiresOn?: string }
				| null;
			if (!response.ok) {
				showClientToast(data?.error ?? t('learning.explain.correctError'), { variant: 'error' });
				return;
			}
			showClientToast(t('learning.explain.correctSuccess'), { variant: 'success' });
			editing = false;
			onCorrected?.(draftDate);
		} catch {
			showClientToast(t('learning.explain.correctError'), { variant: 'error' });
		} finally {
			saving = false;
		}
	}
</script>

<Modal
	{open}
	variant="sheet"
	title={t('learning.explain.title')}
	onClose={onClose}
	data-testid="prediction-explain-sheet"
>
	{#if content}
		<div class="explain-body">
			<p class="primary">{content.primary}</p>
			{#if content.facts.length > 0}
				<ul class="facts">
					{#each content.facts as fact (fact)}
						<li>{fact}</li>
					{/each}
				</ul>
			{/if}
			{#if content.learnMore}
				<p class="learn-more">{content.learnMore}</p>
			{/if}

			{#if canCorrect}
				{#if editing}
					<div class="correct-form">
						<label class="correct-label" for="explain-correct-date">
							{t('learning.explain.correctLabel')}
						</label>
						<input
							id="explain-correct-date"
							class="correct-input"
							type="date"
							bind:value={draftDate}
							disabled={saving}
						/>
						<div class="correct-actions">
							<Button
								variant="ghost"
								type="button"
								disabled={saving}
								onclick={() => {
									editing = false;
								}}
							>
								{t('learning.explain.correctCancel')}
							</Button>
							<Button
								type="button"
								loading={saving}
								disabled={!draftDate}
								onclick={saveCorrection}
							>
								{t('learning.explain.correctSave')}
							</Button>
						</div>
					</div>
				{:else}
					<Button
						variant="secondary"
						type="button"
						onclick={startCorrection}
						data-testid="prediction-explain-correct"
					>
						{t('learning.explain.correctCta')}
					</Button>
				{/if}
			{/if}

			{#if showSettingsLink}
				<a class="settings-link" href="/settings/memory">
					{t('learning.explain.settingsLink')}
				</a>
			{/if}
		</div>
	{/if}
</Modal>

<style>
	.explain-body {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.primary {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		line-height: 1.45;
		color: var(--color-text);
	}

	.facts {
		margin: 0;
		padding-left: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		color: var(--color-text-muted);
		font-size: 0.925rem;
		line-height: 1.45;
	}

	.learn-more {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.correct-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.correct-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.correct-input {
		min-height: 2.75rem;
		padding: 0 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		color: var(--color-text);
		font: inherit;
	}

	.correct-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-xs);
	}

	.settings-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-size: 0.925rem;
		font-weight: 600;
		color: var(--color-primary);
		text-decoration: none;
	}

	.settings-link:hover {
		text-decoration: underline;
	}
</style>
