import { describe, expect, it } from 'vitest';
import {
	POST_REGISTER_SCAN_OAUTH_REDIRECT,
	POST_REGISTER_SCAN_PATH,
	isPostRegisterScanPath
} from './post-register';

describe('post-register navigation', () => {
	it('targets barcode scan hub with fresh-account flag', () => {
		expect(POST_REGISTER_SCAN_PATH).toBe('/scan?freshAccount=1&mode=barcode');
		expect(POST_REGISTER_SCAN_OAUTH_REDIRECT).toBe('/scan?mode=barcode');
	});

	it('recognises post-register scan URLs', () => {
		expect(
			isPostRegisterScanPath('/scan', new URLSearchParams('mode=barcode&freshAccount=1'))
		).toBe(true);
		expect(isPostRegisterScanPath('/scan', new URLSearchParams('mode=hub'))).toBe(false);
		expect(isPostRegisterScanPath('/hem', new URLSearchParams('mode=barcode'))).toBe(false);
	});
});
