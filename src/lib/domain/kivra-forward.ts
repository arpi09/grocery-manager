/** Domains allowed to forward receipts in v1 (spam / abuse mitigation). */
export const KIVRA_FORWARD_SENDER_ALLOWLIST = [
	'kivra.se',
	'ica.se',
	'willys.se',
	'coop.se',
	'hemkop.se',
	'lidl.se',
	'citygross.se'
] as const;

const FORWARD_LOCAL_PART = 'kvitto';

export function parseForwardTokenFromRecipients(recipients: string[]): string | null {
	for (const raw of recipients) {
		const address = extractEmailAddress(raw);
		if (!address) continue;

		const at = address.lastIndexOf('@');
		if (at <= 0) continue;

		const local = address.slice(0, at).toLowerCase();
		const plus = local.indexOf('+');
		if (plus === -1) continue;

		const prefix = local.slice(0, plus);
		if (prefix !== FORWARD_LOCAL_PART) continue;

		const token = local.slice(plus + 1).trim();
		if (token.length >= 16) {
			return token;
		}
	}

	return null;
}

export function buildForwardEmailAddress(token: string, domain: string): string {
	const normalizedDomain = domain.trim().toLowerCase();
	return `${FORWARD_LOCAL_PART}+${token}@${normalizedDomain}`;
}

export function isAllowedKivraForwardSender(from: string): boolean {
	const address = extractEmailAddress(from);
	if (!address) return false;

	const at = address.lastIndexOf('@');
	if (at <= 0) return false;

	const domain = address.slice(at + 1).toLowerCase();
	return KIVRA_FORWARD_SENDER_ALLOWLIST.some(
		(allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
	);
}

function extractEmailAddress(value: string): string | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	const bracketMatch = trimmed.match(/<([^>]+)>/);
	const candidate = (bracketMatch?.[1] ?? trimmed).trim().toLowerCase();
	return candidate.includes('@') ? candidate : null;
}
