import { describe, expect, it } from 'vitest';
import { HEM_PATH } from './app-home';
import {
	POST_REGISTER_APP_HOME_PATH,
	POST_REGISTER_SCAN_OAUTH_REDIRECT,
	POST_REGISTER_SCAN_PATH,
	POST_REGISTER_WELCOME_PATH,
	isPostRegisterPath,
	postRegisterAppHomePath
} from './post-register';

describe('post-register navigation', () => {
	it('targets verify-email after password signup', () => {
		expect(POST_REGISTER_SCAN_PATH).toBe('/verify-email');
		expect(POST_REGISTER_SCAN_OAUTH_REDIRECT).toBe(HEM_PATH);
	});

	it('lands new users on hem with welcome wedge', () => {
		expect(postRegisterAppHomePath()).toBe('/hem?welcome=1');
		expect(POST_REGISTER_APP_HOME_PATH).toBe('/hem?welcome=1');
		expect(POST_REGISTER_WELCOME_PATH).toBe('/hem?welcome=1');
	});

	it('recognises post-register home URLs', () => {
		expect(isPostRegisterPath(HEM_PATH, new URLSearchParams('welcome=1'))).toBe(true);
		expect(isPostRegisterPath(HEM_PATH, new URLSearchParams('freshAccount=1'))).toBe(true);
		expect(isPostRegisterPath(HEM_PATH, new URLSearchParams('mode=barcode'))).toBe(false);
		expect(isPostRegisterPath('/scan', new URLSearchParams('freshAccount=1'))).toBe(false);
	});
});
