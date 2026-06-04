import { describe, expect, it } from 'vitest';
import {
	POST_REGISTER_SCAN_OAUTH_REDIRECT,
	POST_REGISTER_SCAN_PATH,
	isPostRegisterScanPath
} from './post-register';

describe('post-register navigation', () => {
	it('targets unified scan hub with fresh-account flag', () => {
		expect(POST_REGISTER_SCAN_PATH).toBe('/scan?freshAccount=1&mode=photo');
		expect(POST_REGISTER_SCAN_OAUTH_REDIRECT).toBe('/scan');
	});

	it('recognises post-register scan URLs', () => {
		expect(
			isPostRegisterScanPath('/scan', new URLSearchParams('freshAccount=1'))
		).toBe(true);
		expect(isPostRegisterScanPath('/scan', new URLSearchParams('mode=barcode'))).toBe(false);
		expect(isPostRegisterScanPath('/hem', new URLSearchParams('freshAccount=1'))).toBe(false);
	});
});
