import { z } from 'zod';
import { parseSuggestionQuantity } from '$lib/server/shopping-suggestions';

const nameSchema = z.string().trim().min(1, 'Ange en vara').max(200);

export function parseAddShoppingListItem(fields: Record<string, FormDataEntryValue | undefined>) {
	const name = String(fields.name ?? '');
	const quantityRaw = fields.quantity != null ? String(fields.quantity).trim() : '';
	const unitRaw = fields.unit != null ? String(fields.unit).trim() : '';

	const parsed = z
		.object({
			name: nameSchema,
			quantity: z.string().optional(),
			unit: z.string().max(40).optional()
		})
		.safeParse({
			name,
			quantity: quantityRaw || undefined,
			unit: unitRaw || undefined
		});

	if (!parsed.success) {
		return { success: false as const, errors: parsed.error.flatten().fieldErrors };
	}

	let quantity: string | null =
		parsed.data.quantity && parsed.data.quantity.length > 0 ? parsed.data.quantity : null;
	let unit: string | null =
		parsed.data.unit && parsed.data.unit.length > 0 ? parsed.data.unit : null;

	if (quantity) {
		const split = parseSuggestionQuantity(quantity);
		quantity = split.quantity;
		unit = unit ?? split.unit;
	}

	return {
		success: true as const,
		data: { name: parsed.data.name, quantity, unit }
	};
}
