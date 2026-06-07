import { reportClientError } from '$lib/client/error-reporting';
import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, event, status }) => {
	void reportClientError({
		message: error instanceof Error ? error.message : String(error),
		stack: error instanceof Error ? error.stack : null,
		url: event.url.pathname,
		statusCode: status
	});

	return {
		message: status >= 500 ? 'Ett oväntat fel uppstod.' : 'Något gick fel.'
	};
};
