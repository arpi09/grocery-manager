import type { LandingHeroVariant } from '$lib/marketing/landing-variants';
import type { ProductEventType } from '$lib/domain/pmf';

export const LANDING_FUNNEL_EVENT_TYPES = [
	'landing_view',
	'register_click',
	'signup_complete'
] as const;

export type LandingFunnelEventType = (typeof LANDING_FUNNEL_EVENT_TYPES)[number];

export interface LandingFunnelEventRow {
	eventType: ProductEventType;
	metadata: string | null;
}

export interface LandingVariantFunnelStats {
	views: number;
	registerClicks: number;
	signups: number;
}

export type LandingVariantFunnelSummary = Record<LandingHeroVariant, LandingVariantFunnelStats>;

function emptyStats(): LandingVariantFunnelStats {
	return { views: 0, registerClicks: 0, signups: 0 };
}

function parseVariant(metadata: string | null | undefined): LandingHeroVariant | null {
	if (!metadata) {
		return null;
	}
	try {
		const parsed = JSON.parse(metadata) as { variant?: string };
		return parsed.variant === 'a' || parsed.variant === 'b' ? parsed.variant : null;
	} catch {
		return null;
	}
}

/** Aggregate landing funnel events by hero variant for A/B evaluation. */
export function summarizeLandingVariantFunnel(
	rows: LandingFunnelEventRow[]
): LandingVariantFunnelSummary {
	const summary: LandingVariantFunnelSummary = {
		a: emptyStats(),
		b: emptyStats()
	};

	for (const row of rows) {
		const variant = parseVariant(row.metadata);
		if (!variant) {
			continue;
		}

		if (row.eventType === 'landing_view') {
			summary[variant].views += 1;
		} else if (row.eventType === 'register_click') {
			summary[variant].registerClicks += 1;
		} else if (row.eventType === 'signup_complete') {
			summary[variant].signups += 1;
		}
	}

	return summary;
}

export function landingRegisterClickRate(stats: LandingVariantFunnelStats): number | null {
	if (stats.views === 0) {
		return null;
	}
	return stats.registerClicks / stats.views;
}

export function landingSignupRate(stats: LandingVariantFunnelStats): number | null {
	if (stats.views === 0) {
		return null;
	}
	return stats.signups / stats.views;
}
