import type {
	ExpiringShareItemSnapshot,
	ExpiringShareSnapshot
} from '$lib/domain/expiring-share';
import {
	getDefaultPilotCity,
	listPilotCities,
	resolvePilotCity,
	type PilotCity,
	type PilotCitySlug
} from '$lib/domain/pilot-cities';
import type { Locale } from '$lib/i18n/locale';
import type { IExpiringShareRepository } from '$lib/infrastructure/repositories/expiring-share.repository';

const PREVIEW_ITEM_LIMIT = 3;
const DEFAULT_MIN_SUPPLY = 3;

export interface PublicCityFeedItem {
	id: string;
	itemCount: number;
	previewItems: Pick<ExpiringShareItemSnapshot, 'name' | 'expiresOn'>[];
	items: ExpiringShareItemSnapshot[];
	expiresAt: string;
}

export interface PublicCityFeedCityOption {
	slug: PilotCitySlug;
	label: string;
}

export interface PublicCityFeedResult {
	city: PublicCityFeedCityOption;
	hasSupply: boolean;
	items: PublicCityFeedItem[];
	cities: PublicCityFeedCityOption[];
}

export function isPublicCityFeedEnabled(): boolean {
	return process.env.PUBLIC_CITY_FEED_ENABLED === 'true';
}

export function getPublicCityFeedMinSupply(): number {
	const raw = process.env.PUBLIC_CITY_FEED_MIN_SUPPLY;
	if (!raw) {
		return DEFAULT_MIN_SUPPLY;
	}

	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MIN_SUPPLY;
}

export class PublicCityFeedService {
	constructor(private readonly repository: IExpiringShareRepository) {}

	async getCityFeed(
		citySlug: string | null | undefined,
		options?: { locale?: Locale; minSupply?: number }
	): Promise<PublicCityFeedResult> {
		const city = resolvePilotCity(citySlug) ?? getDefaultPilotCity();
		const locale = options?.locale ?? 'sv';
		const minSupply = options?.minSupply ?? getPublicCityFeedMinSupply();
		const rows = await this.repository.findActiveGeoSharesInBoundingBox(city.bounds);
		const items = this.mapRowsToFeedItems(rows);

		return {
			city: this.toCityOption(city, locale),
			hasSupply: items.length >= minSupply,
			items: items.length >= minSupply ? items : [],
			cities: listPilotCities().map((entry) => this.toCityOption(entry, locale))
		};
	}

	private toCityOption(city: PilotCity, locale: Locale): PublicCityFeedCityOption {
		return {
			slug: city.slug,
			label: locale === 'en' ? city.labelEn : city.labelSv
		};
	}

	private mapRowsToFeedItems(
		rows: Awaited<ReturnType<IExpiringShareRepository['findActiveGeoSharesInBoundingBox']>>
	): PublicCityFeedItem[] {
		const items: PublicCityFeedItem[] = [];

		for (const row of rows) {
			let snapshot: ExpiringShareSnapshot;
			try {
				snapshot = JSON.parse(row.snapshotJson) as ExpiringShareSnapshot;
			} catch {
				continue;
			}

			if (snapshot.items.length === 0) {
				continue;
			}

			items.push({
				id: row.id,
				itemCount: snapshot.items.length,
				previewItems: snapshot.items.slice(0, PREVIEW_ITEM_LIMIT).map((item) => ({
					name: item.name,
					expiresOn: item.expiresOn
				})),
				items: snapshot.items,
				expiresAt: row.expiresAt.toISOString()
			});
		}

		items.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
		return items;
	}
}
