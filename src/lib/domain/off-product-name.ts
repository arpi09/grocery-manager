import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/locale';

export interface OffProductNameFields {
	product_name?: string;
	product_name_en?: string;
	product_name_sv?: string;
	generic_name?: string;
	generic_name_en?: string;
	generic_name_sv?: string;
}

function firstNonEmpty(...values: (string | undefined)[]): string | null {
	for (const value of values) {
		const trimmed = value?.trim();
		if (trimmed) {
			return trimmed;
		}
	}
	return null;
}

/** Pick the best display name from Open Food Facts fields for the user's locale. */
export function resolveOffProductName(
	fields: OffProductNameFields,
	barcode: string,
	locale: Locale = DEFAULT_LOCALE
): string {
	if (locale === 'sv') {
		return (
			firstNonEmpty(
				fields.product_name_sv,
				fields.generic_name_sv,
				fields.product_name,
				fields.generic_name,
				fields.product_name_en,
				fields.generic_name_en
			) ?? `Product ${barcode}`
		);
	}

	return (
		firstNonEmpty(
			fields.product_name_en,
			fields.generic_name_en,
			fields.product_name,
			fields.generic_name,
			fields.product_name_sv,
			fields.generic_name_sv
		) ?? `Product ${barcode}`
	);
}
