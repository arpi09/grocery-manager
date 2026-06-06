import type { GamificationService } from '$lib/application/gamification.service';
import type { StatistikService } from '$lib/application/statistik.service';
import type { MilestoneId } from '$lib/domain/gamification';
import { buildSavingsReport } from '$lib/domain/savings-estimate';
import {
	buildWrappedReport,
	parseWrappedMonthParam,
	resolveTopConsumedProduct,
	startOfNextMonth,
	toMonthKey,
	type WrappedReportData
} from '$lib/domain/wrapped';
import type { IConsumptionRepository } from '$lib/infrastructure/repositories/consumption.repository';

export type { WrappedReportData };

export class WrappedService {
	constructor(
		private readonly statistikService: StatistikService,
		private readonly gamificationService: GamificationService,
		private readonly consumptionRepository: IConsumptionRepository
	) {}

	async buildMonthlyReport(
		householdId: string,
		userId: string,
		monthParam: string | null = null,
		referenceDate = new Date()
	): Promise<WrappedReportData> {
		const monthStart = parseWrappedMonthParam(monthParam, referenceDate);
		const periodEnd = startOfNextMonth(monthStart);
		const monthKey = toMonthKey(monthStart);

		const [monthlyEvents, hadConsumptionBefore, snapshot, impact] = await Promise.all([
			this.consumptionRepository.listEventsForSavingsInPeriod(
				householdId,
				monthStart,
				periodEnd
			),
			this.consumptionRepository.hasConsumptionBefore(householdId, monthStart),
			this.gamificationService.evaluateProgress(householdId, userId),
			this.statistikService.getImpact(householdId)
		]);

		const monthlySavings = buildSavingsReport(monthlyEvents);
		const topProduct = resolveTopConsumedProduct(
			monthlyEvents.filter((event) => event.eventType === 'consumed')
		);
		const achievedMilestones = snapshot.milestones
			.filter((milestone) => milestone.achieved)
			.map((milestone) => milestone.id as MilestoneId);

		return buildWrappedReport({
			monthKey,
			isFirstMonth: !hadConsumptionBefore,
			monthlySavings,
			lifetimeSavedSek: snapshot.savedSek,
			topProduct,
			zeroWasteWeeks: impact.zeroWasteWeeks,
			achievedMilestones
		});
	}
}
