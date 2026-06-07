import { describe, expect, it } from 'vitest';
import {
	buildForwardEmailAddress,
	isAllowedKivraForwardSender,
	parseForwardTokenFromRecipients
} from './kivra-forward';

describe('kivra-forward', () => {
	it('parses plus-alias token from recipient list', () => {
		expect(
			parseForwardTokenFromRecipients(['Kvitto <kvitto+abc123def456ghi7@inbound.skaffu.com>'])
		).toBe('abc123def456ghi7');
	});

	it('ignores recipients without kvitto+ alias', () => {
		expect(parseForwardTokenFromRecipients(['other@example.com'])).toBeNull();
	});

	it('builds forward address', () => {
		expect(buildForwardEmailAddress('tok123', 'inbound.skaffu.com')).toBe(
			'kvitto+tok123@inbound.skaffu.com'
		);
	});

	it('allows known receipt senders', () => {
		expect(isAllowedKivraForwardSender('Kivra <noreply@kivra.se>')).toBe(true);
		expect(isAllowedKivraForwardSender('spam@evil.com')).toBe(false);
	});
});
