import {
	PMF_SURVEY_DISMISS_COOLDOWN_MS,
	PMF_SURVEY_FIRST_DELAY_MS,
	PMF_SURVEY_SUBMIT_COOLDOWN_MS,
	type PmfSurveyTrigger
} from '$lib/domain/pmf-survey';

const ELIGIBLE_AT_SUFFIX = 'pmf-survey-eligible-at';
const DISMISSED_AT_SUFFIX = 'pmf-survey-dismissed-at';
const SUBMITTED_AT_SUFFIX = 'pmf-survey-submitted-at';
const HAS_SUBMITTED_SUFFIX = 'pmf-survey-has-submitted';

function storageKey(suffix: string, userId: string): string {
	return `home-pantry-${suffix}:${userId}`;
}

function readTimestamp(userId: string, suffix: string): number | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	const raw = localStorage.getItem(storageKey(suffix, userId));
	if (!raw) {
		return null;
	}

	const parsed = Number(raw);
	return Number.isFinite(parsed) ? parsed : null;
}

function writeTimestamp(userId: string, suffix: string, value: number): void {
	if (typeof localStorage === 'undefined') {
		return;
	}

	localStorage.setItem(storageKey(suffix, userId), String(value));
}

export function getPmfSurveyEligibleAt(userId: string): number | null {
	return readTimestamp(userId, ELIGIBLE_AT_SUFFIX);
}

export function markPmfSurveyEligible(userId?: string | null): void {
	if (!userId) {
		return;
	}

	const eligibleAt = Date.now() + PMF_SURVEY_FIRST_DELAY_MS;
	const existing = readTimestamp(userId, ELIGIBLE_AT_SUFFIX);
	if (existing === null || existing > eligibleAt) {
		writeTimestamp(userId, ELIGIBLE_AT_SUFFIX, eligibleAt);
	}
}

export function dismissPmfSurvey(userId?: string | null): void {
	if (!userId) {
		return;
	}

	writeTimestamp(userId, DISMISSED_AT_SUFFIX, Date.now());
	writeTimestamp(userId, ELIGIBLE_AT_SUFFIX, Date.now() + PMF_SURVEY_DISMISS_COOLDOWN_MS);
}

export function markPmfSurveySubmitted(userId?: string | null): void {
	if (!userId) {
		return;
	}

	const now = Date.now();
	writeTimestamp(userId, SUBMITTED_AT_SUFFIX, now);
	writeTimestamp(userId, ELIGIBLE_AT_SUFFIX, now + PMF_SURVEY_SUBMIT_COOLDOWN_MS);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(storageKey(HAS_SUBMITTED_SUFFIX, userId), '1');
	}
}

export function resolvePmfSurveyTrigger(userId?: string | null): PmfSurveyTrigger {
	if (!userId || typeof localStorage === 'undefined') {
		return 'post_onboarding';
	}

	return localStorage.getItem(storageKey(HAS_SUBMITTED_SUFFIX, userId)) === '1'
		? 'periodic'
		: 'post_onboarding';
}
