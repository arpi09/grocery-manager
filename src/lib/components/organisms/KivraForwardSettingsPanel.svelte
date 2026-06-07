<script lang="ts">
	import Button from '$lib/components/atoms/Button.svelte';
	import FeedbackBanner from '$lib/components/molecules/FeedbackBanner.svelte';
	import { browser } from '$app/environment';
	import { t } from '$lib/i18n';

	interface Props {
		forwardAddress: string;
	}

	let { forwardAddress }: Props = $props();

	let copied = $state(false);

	async function copyAddress() {
		if (!browser) return;
		await navigator.clipboard.writeText(forwardAddress);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}
</script>

<div class="kivra-forward">
	<p class="lead">{t('settings.kivraForward.lead')}</p>
	<ol class="steps">
		<li>{t('settings.kivraForward.step1')}</li>
		<li>{t('settings.kivraForward.step2')}</li>
		<li>{t('settings.kivraForward.step3')}</li>
	</ol>

	<div class="address-row">
		<code class="address" data-testid="kivra-forward-address">{forwardAddress}</code>
		<Button type="button" variant="secondary" onclick={copyAddress}>
			{copied ? t('settings.kivraForward.copied') : t('settings.kivraForward.copy')}
		</Button>
	</div>

	{#if copied}
		<FeedbackBanner tone="success" message={t('settings.kivraForward.copied')} />
	{/if}

	<p class="hint">{t('settings.kivraForward.hint')}</p>
	<p class="beta">{t('settings.kivraForward.beta')}</p>
</div>

<style>
	.kivra-forward {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.lead {
		margin: 0;
		color: var(--color-text-secondary);
	}

	.steps {
		margin: 0;
		padding-left: 1.25rem;
		color: var(--color-text-secondary);
	}

	.address-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: center;
	}

	.address {
		flex: 1 1 16rem;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		background: var(--color-surface-muted);
		font-size: 0.9rem;
		word-break: break-all;
	}

	.hint,
	.beta {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.beta {
		font-style: italic;
	}
</style>
