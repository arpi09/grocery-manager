/** Standard UTM query keys preserved from marketing landing to app CTAs. */
export const UTM_PARAM_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term'
] as const;

export type UtmParamKey = (typeof UTM_PARAM_KEYS)[number];

/** Picks non-empty UTM params from an incoming URL (e.g. community launch links). */
export function pickUtmSearchParams(searchParams: URLSearchParams): URLSearchParams {
	const utm = new URLSearchParams();
	for (const key of UTM_PARAM_KEYS) {
		const value = searchParams.get(key)?.trim();
		if (value) {
			utm.set(key, value);
		}
	}
	return utm;
}

/** Appends query string to a relative or absolute app path. */
export function appendSearchParamsToAppPath(path: string, params: URLSearchParams): string {
	if ([...params.keys()].length === 0) {
		return path;
	}

	const query = params.toString();
	const separator = path.includes('?') ? '&' : '?';
	return `${path}${separator}${query}`;
}
