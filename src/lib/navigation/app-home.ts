/** Authenticated app landing — weekly habit core (`/inkop`). */
export const APP_HOME_PATH = '/inkop';

/** Dashboard route (eat-first briefing, pantry form actions). */
export const HEM_PATH = '/hem';

/** SvelteKit form actions for pantry switch/create (must match `(app)/hem/+page.server.ts`). */
export const PANTRY_SWITCH_ACTION = `${HEM_PATH}?/switchHousehold`;
export const PANTRY_CREATE_ACTION = `${HEM_PATH}?/createHousehold`;
