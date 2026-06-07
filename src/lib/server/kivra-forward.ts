import { env } from '$env/dynamic/private';
import { buildForwardEmailAddress } from '$lib/domain/kivra-forward';

const DEFAULT_FORWARD_DOMAIN = 'inbound.skaffu.com';

export function isKivraForwardEnabled(): boolean {
	const raw = env.KIVRA_FORWARD_ENABLED?.trim().toLowerCase();
	return raw === 'true' || raw === '1' || raw === 'yes';
}

export function getKivraForwardDomain(): string {
	return env.KIVRA_FORWARD_DOMAIN?.trim() || DEFAULT_FORWARD_DOMAIN;
}

export function getKivraForwardSecret(): string | null {
	const dedicated = env.KIVRA_FORWARD_SECRET?.trim();
	if (dedicated) return dedicated;
	const cron = env.CRON_SECRET?.trim();
	return cron || null;
}

export function buildKivraForwardAddress(token: string): string {
	return buildForwardEmailAddress(token, getKivraForwardDomain());
}
