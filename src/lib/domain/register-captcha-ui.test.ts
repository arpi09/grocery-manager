import { describe, expect, it } from 'vitest';
import { getRegisterCaptchaUiState } from './register-captcha-ui';

describe('getRegisterCaptchaUiState', () => {
	it('shows widget when site key is configured', () => {
		expect(getRegisterCaptchaUiState('0xabc', true)).toEqual({
			showWidget: true,
			showMisconfiguredBanner: false,
			disableSubmit: false
		});
	});

	it('shows misconfigured banner and disables submit when required but key missing', () => {
		expect(getRegisterCaptchaUiState('', true)).toEqual({
			showWidget: false,
			showMisconfiguredBanner: true,
			disableSubmit: true
		});
	});

	it('hides widget and banner when captcha not required (local bypass)', () => {
		expect(getRegisterCaptchaUiState('', false)).toEqual({
			showWidget: false,
			showMisconfiguredBanner: false,
			disableSubmit: false
		});
	});

	it('shows widget even when captcha not required if key is present', () => {
		expect(getRegisterCaptchaUiState('0xabc', false)).toEqual({
			showWidget: true,
			showMisconfiguredBanner: false,
			disableSubmit: false
		});
	});
});
