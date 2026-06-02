import { describe, expect, it } from 'vitest';
import { scanHubHref, scanSubFlowFrom } from './scan-nav';

describe('scan-nav', () => {
	it('builds hub and sub-flow return paths', () => {
		expect(scanHubHref('/hem')).toBe('/scan?from=%2Fhem');
		expect(scanSubFlowFrom('/hem')).toBe('/scan?from=%2Fhem');
	});
});
