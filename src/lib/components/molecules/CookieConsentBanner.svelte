<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { hasConsentChoice } from '$lib/cookie-consent';
	import { submitCookieConsent } from '$lib/client/cookie-consent';
	import { writeLandingVariantSession } from '$lib/client/landing-variant-session';
	import Button from '$lib/components/atoms/Button.svelte';
	import { t } from '$lib/i18n';
	import {
		isLandingHeroVariant,
		type LandingHeroVariant
	} from '$lib/marketing/landing-variants';

	interface Props {
		cookieConsent: import('$lib/cookie-consent').CookieConsentChoice | null;
	}

	let { cookieConsent }: Props = $props();

	const landingVariant = $derived.by((): LandingHeroVariant | null => {
		const value = (page.data as { landingVariant?: unknown }).landingVariant;
		return typeof value === 'string' && isLandingHeroVariant(value) ? value : null;
	});

	let dismissed = $state(false);
	let busy = $state(false);

	const visible = $derived(!dismissed && !hasConsentChoice(cookieConsent));

	$effect(() => {
		if (landingVariant) {
			writeLandingVariantSession(landingVariant);
		}
	});

	async function choose(choice: 'all' | 'essential') {
		if (busy) {
			return;
		}
		busy = true;
		const ok = await submitCookieConsent(choice, landingVariant);
		busy = false;
		if (!ok) {
			return;
		}
		dismissed = true;
		await invalidateAll();
	}
</script>

{#if visible}
	<div class="consent-root" role="dialog" aria-labelledby="cookie-consent-title" aria-live="polite">
		<div class="consent-bar">
			<p id="cookie-consent-title" class="consent-text">
				{t('cookieConsent.message')}
				<a href="/privacy" class="consent-link">{t('cookieConsent.privacyLink')}</a>
			</p>
			<div class="consent-actions">
				<Button type="button" variant="primary" disabled={busy} onclick={() => choose('all')}>
					{t('cookieConsent.accept')}
				</Button>
				<Button type="button" variant="secondary" disabled={busy} onclick={() => choose('essential')}>
					{t('cookieConsent.essentialOnly')}
				</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.consent-root {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		z-index: 1200;
		padding: var(--space-sm) var(--space-md) calc(var(--space-sm) + env(safe-area-inset-bottom, 0));
		pointer-events: none;
	}

	.consent-bar {
		pointer-events: auto;
		max-width: 56rem;
		margin: 0 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
		background: color-mix(in srgb, var(--color-surface) 94%, transparent);
		box-shadow: 0 -4px 24px color-mix(in srgb, var(--color-text) 8%, transparent);
		backdrop-filter: blur(8px);
	}

	.consent-text {
		margin: 0;
		flex: 1 1 16rem;
		font-size: 0.9rem;
		line-height: var(--line-height-body);
		color: var(--color-text);
	}

	.consent-link {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.consent-link:hover {
		text-decoration: none;
	}

	.consent-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	@media (max-width: 540px) {
		.consent-bar {
			flex-direction: column;
			align-items: stretch;
		}

		.consent-actions {
			flex-direction: column;
		}
	}
</style>
