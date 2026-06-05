import {
	isActivationComplete,
	isOnboardingExcludedPath,
	isPostOnboardingSurveyPath,
	shouldShowPostOnboardingSurvey
} from '$lib/utils/onboarding';
import { getPmfSurveyEligibleAt, markPmfSurveyEligible } from '$lib/utils/pmf-survey-storage';

export {
	dismissPmfSurvey,
	markPmfSurveyEligible,
	markPmfSurveySubmitted,
	resolvePmfSurveyTrigger
} from '$lib/utils/pmf-survey-storage';

export function shouldShowPmfSurvey(userId?: string | null, pathname = ''): boolean {
	if (typeof localStorage === 'undefined' || !userId) {
		return false;
	}

	if (!isActivationComplete(userId)) {
		return false;
	}

	if (shouldShowPostOnboardingSurvey(userId)) {
		return false;
	}

	if (isOnboardingExcludedPath(pathname) || !isPostOnboardingSurveyPath(pathname)) {
		return false;
	}

	let eligibleAt = getPmfSurveyEligibleAt(userId);
	if (eligibleAt === null) {
		markPmfSurveyEligible(userId);
		eligibleAt = getPmfSurveyEligibleAt(userId);
	}

	return eligibleAt !== null && Date.now() >= eligibleAt;
}
