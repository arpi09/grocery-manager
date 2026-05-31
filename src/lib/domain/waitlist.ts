export const WAITLIST_SOURCES = ['priser', 'settings'] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

export const WAITLIST_LIST_DEFAULT = 50;
export const WAITLIST_LIST_MAX = 200;

export interface WaitlistEntry {
	id: string;
	email: string;
	userId: string | null;
	source: WaitlistSource;
	createdAt: Date;
}

export interface JoinWaitlistInput {
	email: string;
	userId?: string | null;
	source: WaitlistSource;
}

export function isWaitlistSource(value: string): value is WaitlistSource {
	return (WAITLIST_SOURCES as readonly string[]).includes(value);
}
