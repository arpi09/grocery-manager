/** Authenticated app dashboard — separate from public marketing landing at `/`. */
export const APP_HOME_PATH = '/hem';

/** SvelteKit form actions for pantry switch/create (must match `(app)/hem/+page.server.ts`). */
export const PANTRY_SWITCH_ACTION = `${APP_HOME_PATH}?/switchHousehold`;
export const PANTRY_CREATE_ACTION = `${APP_HOME_PATH}?/createHousehold`;
