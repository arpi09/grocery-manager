import { describe, expect, it } from 'vitest';
import { APP_HOME_PATH } from './app-home';
import {
	POST_REGISTER_SCAN_OAUTH_REDIRECT,
	POST_REGISTER_SCAN_PATH,
	isPostRegisterPath
} from './post-register';

describe('post-register navigation', () => {
	it('targets verify-email after password signup', () => {
		expect(POST_REGISTER_SCAN_PATH).toBe('/verify-email');
		expect(POST_REGISTER_SCAN_OAUTH_REDIRECT).toBe(APP_HOME_PATH);
	});

	it('recognises post-register home URLs', () => {
		expect(
			isPostRegisterPath('/hem', new URLSearchParams('freshAccount=1'))
		).toBe(true);
		expect(isPostRegisterPath('/hem', new URLSearchParams('mode=barcode'))).toBe(false);
		expect(isPostRegisterPath('/scan', new URLSearchParams('freshAccount=1'))).toBe(false);
	});
});
