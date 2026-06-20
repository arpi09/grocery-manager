import type { OffProductNameFields } from '$lib/domain/off-product-name';

export interface OffProductImageFields {
	image_front_small_url?: string;
	image_front_url?: string;
}

export function resolveOffImageUrl(product: OffProductImageFields): string | null {
	const small = product.image_front_small_url?.trim();
	if (small) {
		return small;
	}

	const full = product.image_front_url?.trim();
	return full || null;
}

export type { OffProductNameFields };
