export const APP_SETTING_EMAIL_SENDING_ENABLED = 'email_sending_enabled';
export const APP_SETTING_STRIPE_CHECKOUT_ENABLED = 'stripe_checkout_enabled';
export const APP_SETTING_LINKEDIN_OAUTH = 'linkedin_oauth';

export interface LinkedInOAuthTokens {
	refreshToken: string;
	accessToken?: string;
	/** ISO timestamp when accessToken expires */
	expiresAt?: string;
}
