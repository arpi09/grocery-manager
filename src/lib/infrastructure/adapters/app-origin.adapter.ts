import type { AppOriginPort } from '$lib/application/ports/app-origin.port';
import { getAppOrigin } from '$lib/server/origin';

export const appOriginAdapter: AppOriginPort = {
	getOrigin: getAppOrigin
};
