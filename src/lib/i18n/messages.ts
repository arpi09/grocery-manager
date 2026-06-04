import en from './locales/en.json';
import sv from './locales/sv.json';
import { DEFAULT_LOCALE, type Locale } from './locale';

const catalogs: Record<Locale, Record<string, unknown>> = { sv, en };

type NestedMessages = typeof sv;

type MessagePaths<T, Prefix extends string = ''> = T extends string
	? Prefix extends ''
		? never
		: Prefix
	: {
			[K in keyof T & string]: T[K] extends string
				? Prefix extends ''
					? K
					: `${Prefix}.${K}`
				: MessagePaths<T[K], Prefix extends '' ? K : `${Prefix}.${K}`>;
		}[keyof T & string];

export type MessageKey = MessagePaths<NestedMessages>;

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
	let current: unknown = obj;
	for (const part of path.split('.')) {
		if (current == null || typeof current !== 'object') {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === 'string' ? current : undefined;
}

function formatPlural(text: string, params: Record<string, string | number>): string {
	return text.replace(/\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g, (_, key, one, other) => {
		const raw = params[key];
		const count = typeof raw === 'number' ? raw : Number.parseInt(String(raw), 10);
		const chosen = count === 1 ? one : other;
		return chosen
			.replace(/#/g, String(count))
			.replace(/\{(\w+)\}/g, (_match: string, paramKey: string) =>
				String(params[paramKey] ?? '')
			);
	});
}

function interpolate(text: string, params?: Record<string, string | number>): string {
	if (!params) {
		return text;
	}

	const withPlural = formatPlural(text, params);
	return withPlural.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
}

export function translate(
	locale: Locale,
	key: MessageKey,
	params?: Record<string, string | number>
): string {
	const primary = getNested(catalogs[locale], key);
	const fallback =
		locale === DEFAULT_LOCALE ? undefined : getNested(catalogs[DEFAULT_LOCALE], key);
	const text = primary ?? fallback ?? key;
	return interpolate(text, params);
}
