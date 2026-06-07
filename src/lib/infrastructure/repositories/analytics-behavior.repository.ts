import { createHash } from 'node:crypto';
import {
	ANALYTICS_SESSION_IDLE_MS,
	normalizeAnalyticsRoute,
	type AnalyticsBehaviorPeriodDays,
	type AnalyticsInteractionKind,
	type AdminBehaviorFunnel,
	type AdminBehaviorHeatmap,
	type AdminBehaviorOverview,
	type AdminBehaviorRetention,
	type AdminEventExplorer,
	type BehaviorFunnelStep,
	type BehaviorHeatmapRow,
	type BehaviorRetentionPoint,
	type BehaviorRouteOverviewRow
} from '$lib/domain/analytics-behavior';
import { generateId } from '$lib/infrastructure/auth/id';
import { db } from '$lib/infrastructure/db';
import {
	analyticsElementDailyTable,
	analyticsInteractionTable,
	analyticsPageViewTable,
	analyticsRouteDailyTable,
	analyticsSessionTable,
	productEventTable
} from '$lib/infrastructure/db/schema';
import { and, desc, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';

export interface IngestPageViewInput {
	clientId: string;
	route: string;
	enteredAt: Date;
	exitedAt?: Date;
	durationMs?: number;
	referrerRoute?: string;
}

export interface IngestInteractionInput {
	route: string;
	elementKey: string;
	kind: AnalyticsInteractionKind;
	value?: number;
	createdAt: Date;
}

export interface IngestBeaconContext {
	visitorId: string;
	userId: string | null;
	householdId: string | null;
	userAgent: string | null;
	now?: Date;
}

export interface IngestBeaconInput {
	pageViews?: IngestPageViewInput[];
	interactions?: IngestInteractionInput[];
}

export interface IAnalyticsBehaviorRepository {
	ingestBeacon(context: IngestBeaconContext, input: IngestBeaconInput): Promise<void>;
	rollupDaily(day: Date): Promise<{ routeRows: number; elementRows: number }>;
	deleteRawOlderThan(cutoff: Date): Promise<number>;
	getBehaviorOverview(
		periodDays: AnalyticsBehaviorPeriodDays,
		now?: Date
	): Promise<AdminBehaviorOverview>;
	getBehaviorHeatmap(
		route: string,
		periodDays: AnalyticsBehaviorPeriodDays,
		now?: Date
	): Promise<AdminBehaviorHeatmap>;
	getEventExplorer(
		periodDays: AnalyticsBehaviorPeriodDays,
		eventType?: string,
		now?: Date
	): Promise<AdminEventExplorer>;
	getBehaviorFunnel(
		periodDays: AnalyticsBehaviorPeriodDays,
		now?: Date
	): Promise<AdminBehaviorFunnel>;
	getBehaviorRetention(
		periodDays: AnalyticsBehaviorPeriodDays,
		now?: Date
	): Promise<AdminBehaviorRetention>;
}

function hashUserAgent(userAgent: string | null): string | null {
	if (!userAgent?.trim()) {
		return null;
	}
	return createHash('sha256').update(userAgent.trim()).digest('hex').slice(0, 16);
}

function periodStart(periodDays: AnalyticsBehaviorPeriodDays, now: Date): Date {
	const start = new Date(now);
	start.setUTCHours(0, 0, 0, 0);
	start.setUTCDate(start.getUTCDate() - (periodDays - 1));
	return start;
}

function toDayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

export class DrizzleAnalyticsBehaviorRepository implements IAnalyticsBehaviorRepository {
	private async resolveSession(
		context: IngestBeaconContext,
		now: Date
	): Promise<{ id: string }> {
		const idleSince = new Date(now.getTime() - ANALYTICS_SESSION_IDLE_MS);
		const [existing] = await db
			.select({ id: analyticsSessionTable.id })
			.from(analyticsSessionTable)
			.where(
				and(
					eq(analyticsSessionTable.visitorId, context.visitorId),
					gte(analyticsSessionTable.lastSeenAt, idleSince)
				)
			)
			.orderBy(desc(analyticsSessionTable.lastSeenAt))
			.limit(1);

		if (existing) {
			await db
				.update(analyticsSessionTable)
				.set({
					lastSeenAt: now,
					userId: context.userId ?? undefined,
					householdId: context.householdId ?? undefined
				})
				.where(eq(analyticsSessionTable.id, existing.id));
			return existing;
		}

		const id = generateId();
		await db.insert(analyticsSessionTable).values({
			id,
			visitorId: context.visitorId,
			userId: context.userId,
			householdId: context.householdId,
			startedAt: now,
			lastSeenAt: now,
			userAgentHash: hashUserAgent(context.userAgent)
		});
		return { id };
	}

	async ingestBeacon(context: IngestBeaconContext, input: IngestBeaconInput): Promise<void> {
		const now = context.now ?? new Date();
		const pageViews = input.pageViews ?? [];
		const interactions = input.interactions ?? [];
		if (pageViews.length === 0 && interactions.length === 0) {
			return;
		}

		const session = await this.resolveSession(context, now);

		if (pageViews.length > 0) {
			await db.insert(analyticsPageViewTable).values(
				pageViews.map((view) => ({
					id: view.clientId,
					sessionId: session.id,
					route: normalizeAnalyticsRoute(view.route),
					enteredAt: view.enteredAt,
					exitedAt: view.exitedAt ?? null,
					durationMs: view.durationMs ?? null,
					referrerRoute: view.referrerRoute
						? normalizeAnalyticsRoute(view.referrerRoute)
						: null
				}))
			);
		}

		if (interactions.length > 0) {
			await db.insert(analyticsInteractionTable).values(
				interactions.map((interaction) => ({
					id: generateId(),
					sessionId: session.id,
					route: normalizeAnalyticsRoute(interaction.route),
					elementKey: interaction.elementKey.slice(0, 120),
					kind: interaction.kind,
					value: interaction.value ?? null,
					createdAt: interaction.createdAt
				}))
			);
		}

		await db
			.update(analyticsSessionTable)
			.set({ lastSeenAt: now })
			.where(eq(analyticsSessionTable.id, session.id));
	}

	async rollupDaily(day: Date): Promise<{ routeRows: number; elementRows: number }> {
		const dayStart = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
		const dayEnd = new Date(dayStart.getTime() + 86_400_000);
		const dayKey = toDayKey(dayStart);

		const routeAgg = await db
			.select({
				route: analyticsPageViewTable.route,
				viewCount: sql<number>`count(*)::int`,
				uniqueSessions: sql<number>`count(distinct ${analyticsPageViewTable.sessionId})::int`,
				avgDurationMs: sql<number>`coalesce(avg(${analyticsPageViewTable.durationMs}), 0)::int`
			})
			.from(analyticsPageViewTable)
			.where(
				and(
					gte(analyticsPageViewTable.enteredAt, dayStart),
					lt(analyticsPageViewTable.enteredAt, dayEnd)
				)
			)
			.groupBy(analyticsPageViewTable.route);

		for (const row of routeAgg) {
			await db
				.insert(analyticsRouteDailyTable)
				.values({
					day: dayKey,
					route: row.route,
					viewCount: row.viewCount,
					uniqueSessions: row.uniqueSessions,
					avgDurationMs: row.avgDurationMs
				})
				.onConflictDoUpdate({
					target: [analyticsRouteDailyTable.day, analyticsRouteDailyTable.route],
					set: {
						viewCount: row.viewCount,
						uniqueSessions: row.uniqueSessions,
						avgDurationMs: row.avgDurationMs
					}
				});
		}

		const elementAgg = await db
			.select({
				route: analyticsInteractionTable.route,
				elementKey: analyticsInteractionTable.elementKey,
				clickCount: sql<number>`count(*)::int`
			})
			.from(analyticsInteractionTable)
			.where(
				and(
					eq(analyticsInteractionTable.kind, 'click'),
					gte(analyticsInteractionTable.createdAt, dayStart),
					lt(analyticsInteractionTable.createdAt, dayEnd)
				)
			)
			.groupBy(analyticsInteractionTable.route, analyticsInteractionTable.elementKey);

		for (const row of elementAgg) {
			await db
				.insert(analyticsElementDailyTable)
				.values({
					day: dayKey,
					route: row.route,
					elementKey: row.elementKey,
					clickCount: row.clickCount
				})
				.onConflictDoUpdate({
					target: [
						analyticsElementDailyTable.day,
						analyticsElementDailyTable.route,
						analyticsElementDailyTable.elementKey
					],
					set: { clickCount: row.clickCount }
				});
		}

		return { routeRows: routeAgg.length, elementRows: elementAgg.length };
	}

	async deleteRawOlderThan(cutoff: Date): Promise<number> {
		const oldSessions = await db
			.select({ id: analyticsSessionTable.id })
			.from(analyticsSessionTable)
			.where(lt(analyticsSessionTable.startedAt, cutoff));

		if (oldSessions.length === 0) {
			return 0;
		}

		const ids = oldSessions.map((row) => row.id);
		await db.delete(analyticsSessionTable).where(inArray(analyticsSessionTable.id, ids));
		return ids.length;
	}

	private async queryRouteOverview(
		since: Date,
		now: Date
	): Promise<BehaviorRouteOverviewRow[]> {
		const fromDaily = await db
			.select({
				route: analyticsRouteDailyTable.route,
				viewCount: sql<number>`sum(${analyticsRouteDailyTable.viewCount})::int`,
				uniqueSessions: sql<number>`sum(${analyticsRouteDailyTable.uniqueSessions})::int`,
				avgDurationMs: sql<number>`coalesce(avg(${analyticsRouteDailyTable.avgDurationMs}), 0)::int`
			})
			.from(analyticsRouteDailyTable)
			.where(
				and(
					gte(analyticsRouteDailyTable.day, toDayKey(since)),
					lte(analyticsRouteDailyTable.day, toDayKey(now))
				)
			)
			.groupBy(analyticsRouteDailyTable.route)
			.orderBy(desc(sql`sum(${analyticsRouteDailyTable.viewCount})`))
			.limit(10);

		if (fromDaily.length > 0) {
			return fromDaily.map((row) => ({
				route: row.route,
				viewCount: row.viewCount,
				uniqueSessions: row.uniqueSessions,
				avgDurationMs: row.avgDurationMs
			}));
		}

		const fromRaw = await db
			.select({
				route: analyticsPageViewTable.route,
				viewCount: sql<number>`count(*)::int`,
				uniqueSessions: sql<number>`count(distinct ${analyticsPageViewTable.sessionId})::int`,
				avgDurationMs: sql<number>`coalesce(avg(${analyticsPageViewTable.durationMs}), 0)::int`
			})
			.from(analyticsPageViewTable)
			.where(gte(analyticsPageViewTable.enteredAt, since))
			.groupBy(analyticsPageViewTable.route)
			.orderBy(desc(sql`count(*)`))
			.limit(10);

		return fromRaw.map((row) => ({
			route: row.route,
			viewCount: row.viewCount,
			uniqueSessions: row.uniqueSessions,
			avgDurationMs: row.avgDurationMs
		}));
	}

	async getBehaviorOverview(
		periodDays: AnalyticsBehaviorPeriodDays,
		now = new Date()
	): Promise<AdminBehaviorOverview> {
		const start = periodStart(periodDays, now);
		const routes = await this.queryRouteOverview(start, now);
		return {
			periodDays,
			periodStart: start,
			periodEnd: now,
			routes
		};
	}

	async getBehaviorHeatmap(
		route: string,
		periodDays: AnalyticsBehaviorPeriodDays,
		now = new Date()
	): Promise<AdminBehaviorHeatmap> {
		const normalizedRoute = normalizeAnalyticsRoute(route);
		const start = periodStart(periodDays, now);

		const fromDaily = await db
			.select({
				elementKey: analyticsElementDailyTable.elementKey,
				clickCount: sql<number>`sum(${analyticsElementDailyTable.clickCount})::int`
			})
			.from(analyticsElementDailyTable)
			.where(
				and(
					eq(analyticsElementDailyTable.route, normalizedRoute),
					gte(analyticsElementDailyTable.day, toDayKey(start)),
					lte(analyticsElementDailyTable.day, toDayKey(now))
				)
			)
			.groupBy(analyticsElementDailyTable.elementKey)
			.orderBy(desc(sql`sum(${analyticsElementDailyTable.clickCount})`))
			.limit(25);

		let elements: BehaviorHeatmapRow[];
		if (fromDaily.length > 0) {
			elements = fromDaily.map((row) => ({
				elementKey: row.elementKey,
				clickCount: row.clickCount
			}));
		} else {
			const fromRaw = await db
				.select({
					elementKey: analyticsInteractionTable.elementKey,
					clickCount: sql<number>`count(*)::int`
				})
				.from(analyticsInteractionTable)
				.where(
					and(
						eq(analyticsInteractionTable.route, normalizedRoute),
						eq(analyticsInteractionTable.kind, 'click'),
						gte(analyticsInteractionTable.createdAt, start)
					)
				)
				.groupBy(analyticsInteractionTable.elementKey)
				.orderBy(desc(sql`count(*)`))
				.limit(25);
			elements = fromRaw.map((row) => ({
				elementKey: row.elementKey,
				clickCount: row.clickCount
			}));
		}

		return { route: normalizedRoute, periodDays, elements };
	}

	async getEventExplorer(
		periodDays: AnalyticsBehaviorPeriodDays,
		eventType?: string,
		now = new Date()
	): Promise<AdminEventExplorer> {
		const start = periodStart(periodDays, now);
		const conditions = [gte(productEventTable.createdAt, start)];
		if (eventType?.trim()) {
			conditions.push(eq(productEventTable.eventType, eventType.trim() as never));
		}

		const rows = await db
			.select({
				day: sql<string>`to_char(date_trunc('day', ${productEventTable.createdAt}), 'YYYY-MM-DD')`,
				eventType: productEventTable.eventType,
				count: sql<number>`count(*)::int`
			})
			.from(productEventTable)
			.where(and(...conditions))
			.groupBy(
				sql`date_trunc('day', ${productEventTable.createdAt})`,
				productEventTable.eventType
			)
			.orderBy(desc(sql`date_trunc('day', ${productEventTable.createdAt})`));

		return {
			periodDays,
			events: rows.map((row) => ({
				day: row.day,
				eventType: row.eventType,
				count: row.count
			}))
		};
	}

	async getBehaviorFunnel(
		periodDays: AnalyticsBehaviorPeriodDays,
		now = new Date()
	): Promise<AdminBehaviorFunnel> {
		const start = periodStart(periodDays, now);

		const [landingViews, signups, homeViews, firstScans] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'landing_view'),
						gte(productEventTable.createdAt, start)
					)
				),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'signup_complete'),
						gte(productEventTable.createdAt, start)
					)
				),
			db
				.select({ count: sql<number>`count(distinct ${analyticsPageViewTable.sessionId})::int` })
				.from(analyticsPageViewTable)
				.where(
					and(eq(analyticsPageViewTable.route, '/hem'), gte(analyticsPageViewTable.enteredAt, start))
				),
			db
				.select({ count: sql<number>`count(*)::int` })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'first_scan'),
						gte(productEventTable.createdAt, start)
					)
				)
		]);

		const steps: BehaviorFunnelStep[] = [
			{ step: 'landing', count: landingViews[0]?.count ?? 0 },
			{ step: 'signup', count: signups[0]?.count ?? 0 },
			{ step: 'home', count: homeViews[0]?.count ?? 0 },
			{ step: 'first_scan', count: firstScans[0]?.count ?? 0 }
		];

		return { periodDays, steps };
	}

	async getBehaviorRetention(
		periodDays: AnalyticsBehaviorPeriodDays,
		now = new Date()
	): Promise<AdminBehaviorRetention> {
		const start = periodStart(periodDays, now);
		const offsets = [1, 7, 30];
		const points: BehaviorRetentionPoint[] = [];

		for (const dayOffset of offsets) {
			const cohortEnd = new Date(now);
			cohortEnd.setUTCDate(cohortEnd.getUTCDate() - dayOffset);
			const cohortStart = new Date(cohortEnd);
			cohortStart.setUTCDate(cohortStart.getUTCDate() - 7);

			if (cohortStart < start) {
				points.push({ dayOffset, rate: 0, eligible: 0, retained: 0 });
				continue;
			}

			const signups = await db
				.select({ userId: productEventTable.userId })
				.from(productEventTable)
				.where(
					and(
						eq(productEventTable.eventType, 'signup_complete'),
						gte(productEventTable.createdAt, cohortStart),
						lt(productEventTable.createdAt, cohortEnd)
					)
				);

			const userIds = [...new Set(signups.map((row) => row.userId).filter(Boolean))] as string[];
			const eligible = userIds.length;
			if (eligible === 0) {
				points.push({ dayOffset, rate: 0, eligible: 0, retained: 0 });
				continue;
			}

			const returnDayStart = new Date(cohortEnd);
			returnDayStart.setUTCDate(returnDayStart.getUTCDate() + dayOffset);
			const returnDayEnd = new Date(returnDayStart);
			returnDayEnd.setUTCDate(returnDayEnd.getUTCDate() + 1);

			const retainedRows = await db
				.select({ count: sql<number>`count(distinct ${analyticsSessionTable.userId})::int` })
				.from(analyticsSessionTable)
				.where(
					and(
						inArray(analyticsSessionTable.userId, userIds),
						gte(analyticsSessionTable.lastSeenAt, returnDayStart),
						lt(analyticsSessionTable.lastSeenAt, returnDayEnd)
					)
				);

			const retained = retainedRows[0]?.count ?? 0;
			points.push({
				dayOffset,
				rate: eligible > 0 ? retained / eligible : 0,
				eligible,
				retained
			});
		}

		return { periodDays, points };
	}
}
