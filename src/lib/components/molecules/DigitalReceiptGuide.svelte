<script lang="ts">
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	const STORAGE_KEY = 'digital-receipt-guide-seen';

	interface Props {
		/** Keep guide expanded on first receipt path (e.g. onboarding). */
		prominent?: boolean;
	}

	let { prominent = false }: Props = $props();

	let open = $state(prominent);

	$effect(() => {
		if (!browser || prominent) return;
		if (sessionStorage.getItem(STORAGE_KEY)) {
			open = false;
		}
	});

	$effect(() => {
		if (!browser || prominent || open) return;
		sessionStorage.setItem(STORAGE_KEY, '1');
	});
</script>

<details class="guide" bind:open>
	<summary class="summary">
		<span class="summary-title">{t('scan.receiptGuide.title')}</span>
		<span class="summary-hint">{open ? t('scan.receiptGuide.hide') : t('scan.receiptGuide.show')}</span>
	</summary>

	<div class="body">
		<p class="intro">
			{t('scan.receiptGuide.intro')}
		</p>

		<ol class="steps">
			<li>{t('scan.receiptGuide.step1')}</li>
			<li>{t('scan.receiptGuide.step2')}</li>
			<li>{t('scan.receiptGuide.step3')}</li>
		</ol>

		<p class="examples-label">{t('scan.receiptGuide.examplesLabel')}</p>
		<ul class="examples" aria-label={t('scan.receiptGuide.examplesAria')}>
			<li>Kivra</li>
			<li>E-post</li>
			<li>Bankapp</li>
			<li>Apple Wallet</li>
		</ul>

		<details class="kivra">
			<summary>{t('scan.receiptGuide.kivraTitle')}</summary>
			<ul>
				<li>{t('scan.receiptGuide.kivraStep1')}</li>
				<li>{t('scan.receiptGuide.kivraStep2')}</li>
				<li>{t('scan.receiptGuide.kivraStep3')}</li>
			</ul>
		</details>
	</div>
</details>

<style>
	.guide {
		margin: 0 0 var(--space-md);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-surface);
		box-shadow: var(--shadow-sm);
	}

	.summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		cursor: pointer;
		list-style: none;
		min-height: 2.75rem;
		font-weight: 600;
	}

	.summary::-webkit-details-marker {
		display: none;
	}

	.summary-title {
		font-size: 0.95rem;
	}

	.summary-hint {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-primary);
		flex-shrink: 0;
	}

	.body {
		padding: 0 var(--space-md) var(--space-md);
		border-top: 1px solid var(--color-border);
	}

	.intro {
		margin: var(--space-sm) 0 var(--space-md);
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.45;
	}

	.steps {
		margin: 0 0 var(--space-md);
		padding-left: 1.15rem;
		font-size: 0.875rem;
		line-height: 1.45;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.examples-label {
		margin: 0 0 var(--space-xs);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.examples {
		list-style: none;
		margin: 0 0 var(--space-md);
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
	}

	.examples li {
		font-size: 0.8rem;
		padding: 0.25rem 0.55rem;
		border: 1px solid var(--color-border);
		border-radius: 999px;
		background: var(--color-surface-muted);
		color: var(--color-text-muted);
	}

	.kivra {
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		background: var(--color-surface-muted);
	}

	.kivra summary {
		cursor: pointer;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--color-primary);
		min-height: 2.75rem;
		display: flex;
		align-items: center;
		list-style: none;
	}

	.kivra summary::-webkit-details-marker {
		display: none;
	}

	.kivra ul {
		margin: 0 0 var(--space-xs);
		padding: 0 0 0 1rem;
		font-size: 0.82rem;
		color: var(--color-text-muted);
		line-height: 1.4;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
</style>
