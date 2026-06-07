import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockEnv } = vi.hoisted(() => ({
	mockEnv: {} as Record<string, string | undefined>
}));

vi.mock('$env/dynamic/private', () => ({
	env: mockEnv
}));

import { buildKivraForwardAddress, isKivraForwardEnabled } from './kivra-forward';

describe('kivra-forward server helpers', () => {
	beforeEach(() => {
		for (const key of Object.keys(mockEnv)) {
			delete mockEnv[key];
		}
	});

	it('is disabled by default', () => {
		expect(isKivraForwardEnabled()).toBe(false);
	});

	it('enables with KIVRA_FORWARD_ENABLED=true', () => {
		mockEnv.KIVRA_FORWARD_ENABLED = 'true';
		expect(isKivraForwardEnabled()).toBe(true);
	});

	it('builds forward address with default domain', () => {
		expect(buildKivraForwardAddress('abc123')).toBe('kvitto+abc123@inbound.skaffu.com');
	});

	it('uses custom domain when set', () => {
		mockEnv.KIVRA_FORWARD_DOMAIN = 'receipts.example.com';
		expect(buildKivraForwardAddress('tok')).toBe('kvitto+tok@receipts.example.com');
	});
});
