/** Preset shortcuts for logging partial consumption (share of remaining stock). */
export type ConsumptionPreset = 'lite' | 'half' | 'all';

export const CONSUMPTION_PRESET_FRACTION: Record<Exclude<ConsumptionPreset, 'all'>, number> = {
	lite: 0.1,
	half: 0.5
};

export function parseNumericQuantity(value: string): number | null {
	const trimmed = value.trim().replace(',', '.');
	if (!trimmed) return null;
	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return parsed;
}

export function formatNumericQuantity(value: number): string {
	const rounded = Math.round(value * 100) / 100;
	const text = String(rounded);
	return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

export function amountFromPreset(stock: number, preset: ConsumptionPreset): number {
	if (preset === 'all') return stock;
	return stock * CONSUMPTION_PRESET_FRACTION[preset];
}

export function subtractQuantity(stock: number, used: number): number {
	return Math.max(0, Math.round((stock - used) * 100) / 100);
}

export type ResolveConsumptionResult =
	| { ok: true; used: number; remaining: number; finished: boolean }
	| { ok: false; reason: 'invalid_stock' | 'invalid_amount' | 'amount_exceeds_stock' };

export interface ResolveConsumptionInput {
	stockQuantity: string;
	preset?: ConsumptionPreset;
	customAmount?: string;
}

export function resolveConsumptionAmount(input: ResolveConsumptionInput): ResolveConsumptionResult {
	const stock = parseNumericQuantity(input.stockQuantity);
	if (stock === null) {
		return { ok: false, reason: 'invalid_stock' };
	}

	let used: number;
	if (input.preset) {
		used = amountFromPreset(stock, input.preset);
	} else if (input.customAmount?.trim()) {
		const custom = parseNumericQuantity(input.customAmount);
		if (custom === null) {
			return { ok: false, reason: 'invalid_amount' };
		}
		used = custom;
	} else {
		used = stock;
	}

	if (used <= 0) {
		return { ok: false, reason: 'invalid_amount' };
	}
	if (used > stock + 1e-9) {
		return { ok: false, reason: 'amount_exceeds_stock' };
	}

	const remaining = subtractQuantity(stock, used);
	return {
		ok: true,
		used,
		remaining,
		finished: remaining <= 0
	};
}
