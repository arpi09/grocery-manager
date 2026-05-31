/** UTM values captured once at signup (launch attribution). */
export type SignupUtm = {
	source?: string;
	medium?: string;
	campaign?: string;
	content?: string;
};

export const SIGNUP_UTM_MAX_LENGTH = 128;
