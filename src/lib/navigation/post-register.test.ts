import { describe, expect, it } from 'vitest';

import { INKOP_PATH } from './app-home';

import {
	POST_REGISTER_APP_HOME_PATH,
	POST_REGISTER_SCAN_OAUTH_REDIRECT,
	POST_REGISTER_SCAN_PATH,
	isPostRegisterPath,
	postRegisterAppHomePath
} from './post-register';

describe('post-register navigation', () => {
	it('targets verify-email after password signup', () => {
		expect(POST_REGISTER_SCAN_PATH).toBe('/verify-email');

		expect(POST_REGISTER_SCAN_OAUTH_REDIRECT).toBe(INKOP_PATH);
	});

	it('lands new users on inkop with freshAccount wedge', () => {
		expect(postRegisterAppHomePath()).toBe('/inkop?freshAccount=1');
		expect(POST_REGISTER_APP_HOME_PATH).toBe('/inkop?freshAccount=1');
	});

	it('recognises post-register home URLs', () => {
		expect(isPostRegisterPath(INKOP_PATH, new URLSearchParams('freshAccount=1'))).toBe(true);

		expect(isPostRegisterPath(INKOP_PATH, new URLSearchParams('mode=barcode'))).toBe(false);

		expect(isPostRegisterPath('/scan', new URLSearchParams('freshAccount=1'))).toBe(false);
	});
});
