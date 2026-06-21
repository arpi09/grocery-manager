import { fail, redirect } from '@sveltejs/kit';
import {
	formatWeekRangeLabel,
	parseWeekParam,
	shiftWeek,
	startOfWeekMonday,
	toIsoDate
} from '$lib/domain/calendar-display';
import { MEAL_PLAN_IDEAS_MAX } from '$lib/domain/meal-plan-display';
import { appendActionToast } from '$lib/utils/action-toast';
import {
	createMealSchema,
	deleteMealSchema,
	scheduleIdeaSchema,
	updateMealSchema
} from '$lib/validation/meal-plan.schemas';
import type { Actions, PageServerLoad } from './$types';

function parseMonthParam(month: string | null): Date {
	if (!month || !/^\d{4}-\d{2}$/.test(month)) {
		return new Date();
	}

	const [yearRaw, monthRaw] = month.split('-');
	const year = Number(yearRaw);
	const monthIndex = Number(monthRaw) - 1;
	if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
		return new Date();
	}
	return new Date(year, monthIndex, 1);
}

function toMonthKey(date: Date): string {
	return toIsoDate(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function shiftDays(date: Date, days: number): Date {
	const copy = new Date(date);
	copy.setDate(copy.getDate() + days);
	return copy;
}

function startOfCalendarGrid(monthStart: Date): Date {
	const day = monthStart.getDay();
	const mondayBasedOffset = (day + 6) % 7;
	return shiftDays(monthStart, -mondayBasedOffset);
}

function endOfCalendarGrid(monthEnd: Date): Date {
	const day = monthEnd.getDay();
	const mondayBasedIndex = (day + 6) % 7;
	return shiftDays(monthEnd, 6 - mondayBasedIndex);
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const todayIso = toIsoDate(new Date());
	const focusedWeekStart = parseWeekParam(url.searchParams.get('week'), todayIso);
	const baseMonth = parseMonthParam(url.searchParams.get('month') ?? focusedWeekStart.slice(0, 7));
	const monthStart = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
	const monthEnd = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0);
	let gridStart = startOfCalendarGrid(monthStart);
	let gridEnd = endOfCalendarGrid(monthEnd);
	gridStart = shiftDays(gridStart, -7);
	gridEnd = shiftDays(gridEnd, 7);

	const userId = locals.user!.id;
	const householdId = locals.householdId!;
	const [meals, dashboard, recipeIdeas] = await Promise.all([
		locals.mealPlanService.listPlannedMealsByRange(userId, toIsoDate(gridStart), toIsoDate(gridEnd)),
		locals.inventoryService.getDashboard(householdId),
		locals.mealPlanService.listRecipeIdeas(userId, MEAL_PLAN_IDEAS_MAX)
	]);

	const mealsByDate = new Map<string, typeof meals>();
	for (const meal of meals) {
		const list = mealsByDate.get(meal.plannedDate) ?? [];
		list.push(meal);
		mealsByDate.set(meal.plannedDate, list);
	}

	const weeks: Array<
		Array<{
			date: string;
			dayOfMonth: number;
			isCurrentMonth: boolean;
			meals: typeof meals;
		}>
	> = [];

	let cursor = new Date(gridStart);
	while (cursor <= gridEnd) {
		const week = [];
		for (let i = 0; i < 7; i += 1) {
			const iso = toIsoDate(cursor);
			week.push({
				date: iso,
				dayOfMonth: cursor.getDate(),
				isCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
				meals: mealsByDate.get(iso) ?? []
			});
			cursor = shiftDays(cursor, 1);
		}
		weeks.push(week);
	}

	const previousMonth = toMonthKey(new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1));
	const nextMonth = toMonthKey(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1));

	return {
		month: toMonthKey(monthStart),
		monthLabel: monthStart.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }),
		previousMonth,
		nextMonth,
		focusedWeekStart,
		previousWeek: shiftWeek(focusedWeekStart, -1),
		nextWeek: shiftWeek(focusedWeekStart, 1),
		weekRangeLabel: formatWeekRangeLabel(focusedWeekStart),
		todayWeekStart: startOfWeekMonday(todayIso),
		weeks,
		expiringSoon: dashboard.expiringSoon,
		plannedMealCount: meals.length,
		recipeIdeas: recipeIdeas.map((idea) => ({
			...idea,
			createdAt: idea.createdAt.toISOString()
		}))
	};
};

function monthRedirectTarget(month: string): string {
	return `/planer?month=${encodeURIComponent(month)}`;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const month = String(formData.get('month') ?? '');
		const parsed = createMealSchema.safeParse({
			title: formData.get('title'),
			plannedDate: formData.get('plannedDate'),
			notes: formData.get('notes')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.mealPlanService.createPlannedMeal(locals.user!.id, {
			title: parsed.data.title,
			plannedDate: parsed.data.plannedDate,
			notes: parsed.data.notes || null
		});

		redirect(302, appendActionToast(monthRedirectTarget(month), 'mealCreated', parsed.data.title));
	},
	update: async ({ request, locals }) => {
		const formData = await request.formData();
		const month = String(formData.get('month') ?? '');
		const parsed = updateMealSchema.safeParse({
			id: formData.get('id'),
			title: formData.get('title'),
			plannedDate: formData.get('plannedDate'),
			notes: formData.get('notes')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.mealPlanService.updatePlannedMeal(locals.user!.id, parsed.data.id, {
			title: parsed.data.title,
			plannedDate: parsed.data.plannedDate,
			notes: parsed.data.notes || null
		});

		redirect(302, appendActionToast(monthRedirectTarget(month), 'mealUpdated', parsed.data.title));
	},
	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const month = String(formData.get('month') ?? '');
		const title = String(formData.get('title') ?? '');
		const parsed = deleteMealSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.mealPlanService.deletePlannedMeal(locals.user!.id, parsed.data.id);
		redirect(302, appendActionToast(monthRedirectTarget(month), 'mealDeleted', title));
	},
	scheduleIdea: async ({ request, locals }) => {
		const formData = await request.formData();
		const month = String(formData.get('month') ?? '');
		const title = String(formData.get('title') ?? '');
		const parsed = scheduleIdeaSchema.safeParse({
			ideaId: formData.get('ideaId'),
			plannedDate: formData.get('plannedDate')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.mealPlanService.createPlannedMealFromIdea(
			locals.user!.id,
			parsed.data.ideaId,
			parsed.data.plannedDate
		);
		redirect(302, appendActionToast(monthRedirectTarget(month), 'mealScheduled', title));
	}
};
