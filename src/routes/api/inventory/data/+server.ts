import { json } from '@sveltejs/kit';
import { INVENTORY_LIST_DEFAULT, INVENTORY_LIST_MAX } from '$lib/domain/inventory-list';
import { isStorageLocation } from '$lib/domain/location';
import { translate } from '$lib/i18n/messages';
import { requireHousehold } from '$lib/server/api-guards';
import type { RequestHandler } from './$types';

const SECTIONS = ['active', 'finished', 'autoExpired'] as const;
type InventorySection = (typeof SECTIONS)[number];

function parseLimit(raw: string | null, defaultValue: number, max: number): number {
	const parsed = Number(raw ?? defaultValue);
	if (!Number.isFinite(parsed)) {
		return defaultValue;
	}
	return Math.min(max, Math.max(1, Math.floor(parsed)));
}

function parseOffset(raw: string | null): number {
	const parsed = Number(raw ?? 0);
	if (!Number.isFinite(parsed)) {
		return 0;
	}
	return Math.max(0, Math.floor(parsed));
}

function isSection(value: string | null): value is InventorySection {
	return value !== null && SECTIONS.includes(value as InventorySection);
}

function serializeItem<T extends { createdAt: Date; updatedAt: Date }>(
	item: T
): Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string } {
	return {
		...item,
		createdAt: item.createdAt.toISOString(),
		updatedAt: item.updatedAt.toISOString()
	};
}

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = requireHousehold(locals);
	if (!auth.authorized) {
		return auth.response;
	}

	const sectionParam = url.searchParams.get('section');
	if (!isSection(sectionParam)) {
		return json(
			{ error: translate(locals.locale, 'errors.api.invalidSection') },
			{ status: 400 }
		);
	}

	const locationParam = url.searchParams.get('location');
	if (!locationParam || !isStorageLocation(locationParam)) {
		return json(
			{ error: translate(locals.locale, 'errors.api.invalidLocation') },
			{ status: 400 }
		);
	}

	const householdId = auth.householdId;
	const location = locationParam;

	if (sectionParam === 'active') {
		const searchQuery = url.searchParams.get('q')?.trim() ?? '';

		if (searchQuery.length >= 2) {
			const limit = parseLimit(
				url.searchParams.get('limit'),
				INVENTORY_LIST_DEFAULT,
				INVENTORY_LIST_MAX
			);
			const items = await locals.inventoryService.searchActiveByLocation(
				householdId,
				location,
				searchQuery,
				limit
			);

			return json({
				items: items.map(serializeItem),
				total: items.length
			});
		}

		const limit = parseLimit(
			url.searchParams.get('limit'),
			INVENTORY_LIST_DEFAULT,
			INVENTORY_LIST_MAX
		);
		const offset = parseOffset(url.searchParams.get('offset'));
		const [items, total] = await Promise.all([
			locals.inventoryService.listByLocationPaginated(householdId, location, limit, offset),
			locals.inventoryService.countActiveByLocation(householdId, location)
		]);

		return json({
			items: items.map(serializeItem),
			total
		});
	}

	if (sectionParam === 'autoExpired') {
		const [items, total] = await Promise.all([
			locals.inventoryService.listAutoExpiredByLocation(householdId, location),
			locals.inventoryService.countAutoExpiredByLocation(householdId, location)
		]);

		return json({
			items: items.map(serializeItem),
			total
		});
	}

	const [items, total] = await Promise.all([
		locals.inventoryService.listFinishedByLocation(householdId, location),
		locals.inventoryService.countFinishedByLocation(householdId, location)
	]);

	return json({
		items: items.map(serializeItem),
		total
	});
};
