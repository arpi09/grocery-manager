/** Weekly acquisition loop events — see docs/ACQUISITION_LOOPS_V1.md */
export const ACQUISITION_WEEKLY_EVENT_TYPES = [
	'shared_list_opened',
	'shared_list_signup_completed',
	'public_surface_viewed',
	'public_surface_signup_clicked'
] as const;

export type AcquisitionWeeklyEventType = (typeof ACQUISITION_WEEKLY_EVENT_TYPES)[number];

export const ACQUISITION_CTR_EVENT_TYPE = 'shared_list_signup_clicked' as const;

export type AcquisitionEventCounts = Record<AcquisitionWeeklyEventType, number> & {
	shared_list_signup_clicked: number;
};

export interface AcquisitionMetricsSnapshot {
	periodStart: Date;
	periodEnd: Date;
	periodDays: number;
	counts: AcquisitionEventCounts;
	/** shared_list_signup_completed / shared_list_opened */
	sharedListSignupConversion: number | null;
	/** shared_list_signup_clicked / shared_list_opened — V1 target >8% */
	sharedListSignupCtr: number | null;
	/** public_surface_signup_clicked / public_surface_viewed */
	publicSurfaceSignupCtr: number | null;
}

export function buildAcquisitionMetricsSnapshot(
	counts: AcquisitionEventCounts,
	periodStart: Date,
	periodEnd: Date,
	periodDays = 7
): AcquisitionMetricsSnapshot {
	const sharedListSignupConversion =
		counts.shared_list_opened > 0
			? counts.shared_list_signup_completed / counts.shared_list_opened
			: null;
	const sharedListSignupCtr =
		counts.shared_list_opened > 0
			? counts.shared_list_signup_clicked / counts.shared_list_opened
			: null;
	const publicSurfaceSignupCtr =
		counts.public_surface_viewed > 0
			? counts.public_surface_signup_clicked / counts.public_surface_viewed
			: null;

	return {
		periodStart,
		periodEnd,
		periodDays,
		counts,
		sharedListSignupConversion,
		sharedListSignupCtr,
		publicSurfaceSignupCtr
	};
}

export function emptyAcquisitionEventCounts(): AcquisitionEventCounts {
	return {
		shared_list_opened: 0,
		shared_list_signup_completed: 0,
		public_surface_viewed: 0,
		public_surface_signup_clicked: 0,
		shared_list_signup_clicked: 0
	};
}
