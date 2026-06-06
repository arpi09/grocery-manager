import { error } from '@sveltejs/kit';
import { isValidReportMonth } from '$lib/domain/skaffurapport';
import { skaffurapportService } from '$lib/server/di';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	if (!isValidReportMonth(params.month)) {
		error(404, 'Not found');
	}

	const report = await skaffurapportService.getOrAggregateReport(params.month);
	if (!report) {
		error(404, 'Not found');
	}

	return {
		report,
		month: params.month
	};
};
