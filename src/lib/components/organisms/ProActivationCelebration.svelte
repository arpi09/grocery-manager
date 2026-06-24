<script lang="ts">
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import Button from '$lib/components/atoms/Button.svelte';
	import CelebrationBurst from '$lib/components/atoms/CelebrationBurst.svelte';
	import FeatureIcon from '$lib/components/atoms/FeatureIcon.svelte';
	import Modal from '$lib/components/molecules/Modal.svelte';
	import { t } from '$lib/i18n';

	interface Props {
		show: boolean;
		isPro: boolean;
	}

	let { show, isPro }: Props = $props();

	let open = $state(false);
	let activating = $state(false);
	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function clearPoll() {
		if (pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	}

	function dismiss() {
		clearPoll();
		open = false;
		if (browser) {
			void goto('/settings/plan', { replaceState: true, keepFocus: true });
		}
	}

	$effect(() => {
		if (!browser || !show) {
			clearPoll();
			open = false;
			activating = false;
			return;
		}

		open = true;
		activating = !isPro;

		if (isPro) {
			clearPoll();
			return;
		}

		let attempts = 0;
		clearPoll();
		pollTimer = setInterval(() => {
			attempts += 1;
			void invalidateAll();
			if (attempts >= 20) {
				clearPoll();
			}
		}, 1500);

		return () => clearPoll();
	});

	$effect(() => {
		if (isPro) {
			activating = false;
		}
	});
</script>

<Modal
	{open}
	onClose={dismiss}
	variant="center"
	dismissible={true}
	panelClass="pro-celebration-panel"
	title={activating ? t('settings.plan.celebrationActivatingTitle') : t('settings.plan.celebrationTitle')}
>
	<div class="celebration-body">
		<CelebrationBurst active={open && !activating} />
		<div class="celebration-icon motion-fade-in" aria-hidden="true">
			<FeatureIcon id="sparkle" size={36} />
		</div>
		<span class="pro-badge">{t('settings.plan.proBadge')}</span>
		{#if activating}
			<p class="celebrate-woohoo">{t('settings.plan.celebrationActivatingBody')}</p>
			<p class="celebrate-sub">{t('settings.plan.celebrationActivatingHint')}</p>
		{:else}
			<p class="celebrate-woohoo">{t('settings.plan.celebrationWoohoo')}</p>
			<p class="celebrate-sub">{t('settings.plan.celebrationBody')}</p>
			<div class="celebration-actions">
				<Button type="button" fullWidth onclick={dismiss}>
					{t('settings.plan.celebrationCta')}
				</Button>
			</div>
		{/if}
		{#if !activating}
			<button type="button" class="dismiss-link" onclick={dismiss}>
				{t('settings.plan.celebrationDismiss')}
			</button>
		{/if}
	</div>
</Modal>

<style>
	:global(.pro-celebration-panel) {
		width: min(420px, calc(100vw - 2 * var(--space-md)));
		max-height: min(90dvh, 34rem);
	}

	.celebration-body {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg) var(--space-lg);
		text-align: center;
		overflow: hidden;
	}

	.pro-badge {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--color-on-primary);
		background: linear-gradient(
			135deg,
			var(--color-primary),
			color-mix(in srgb, var(--color-primary) 70%, var(--color-learning-ai))
		);
		box-shadow: 0 2px 12px color-mix(in srgb, var(--color-primary) 35%, transparent);
	}

	.celebration-icon {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 4.25rem;
		height: 4.25rem;
		border-radius: 999px;
		background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface-muted));
		color: var(--color-primary);
		box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-primary) 10%, transparent);
		animation: pro-icon-glow 2.2s ease-in-out infinite;
	}

	@keyframes pro-icon-glow {
		0%,
		100% {
			box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-primary) 10%, transparent);
		}
		50% {
			box-shadow: 0 0 0 14px color-mix(in srgb, var(--color-primary) 5%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.celebration-icon {
			animation: none;
		}
	}

	.celebrate-woohoo {
		position: relative;
		z-index: 1;
		margin: 0;
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.35;
		color: var(--color-text);
		animation: celebrate-pop 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) both;
	}

	.celebrate-sub {
		position: relative;
		z-index: 1;
		margin: 0;
		font-size: 0.95rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}

	@keyframes celebrate-pop {
		from {
			opacity: 0;
			transform: scale(0.92) translateY(0.35rem);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.celebrate-woohoo {
			animation: none;
		}
	}

	.celebration-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		width: 100%;
	}

	.dismiss-link {
		position: relative;
		z-index: 1;
		border: none;
		background: none;
		color: var(--color-text-muted);
		font-size: 0.875rem;
		cursor: pointer;
		padding: var(--space-xs);
		text-decoration: underline;
	}
</style>
