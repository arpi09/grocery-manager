export type RegisterCaptchaUiState = {
	showWidget: boolean;
	showMisconfiguredBanner: boolean;
	disableSubmit: boolean;
};

/** Register form visibility — widget when key exists; banner + disabled submit when required but missing. */
export function getRegisterCaptchaUiState(
	turnstileSiteKey: string,
	captchaRequired: boolean
): RegisterCaptchaUiState {
	const showMisconfiguredBanner = captchaRequired && !turnstileSiteKey;
	return {
		showWidget: Boolean(turnstileSiteKey),
		showMisconfiguredBanner,
		disableSubmit: showMisconfiguredBanner
	};
}
