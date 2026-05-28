import { fail, redirect } from '@sveltejs/kit';
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

function toIsoDate(date: Date): string {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, '0');
	const d = `${date.getDate()}`.padStart(2, '0');
	return `${y}-${m}-${d}`;
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
	const baseMonth = parseMonthParam(url.searchParams.get('month'));
	const monthStart = new Date(baseMonth.getFullYear(), baseMonth.getMonth(), 1);
	const monthEnd = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 0);
	const gridStart = startOfCalendarGrid(monthStart);
	const gridEnd = endOfCalendarGrid(monthEnd);

	const meals = await locals.mealPlanService.listPlannedMealsByRange(
		locals.user!.id,
		toIsoDate(gridStart),
		toIsoDate(gridEnd)
	);
	const ideas = await locals.mealPlanService.listRecipeIdeas(locals.user!.id, 12);

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
		weeks,
		ideas
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

		redirect(302, monthRedirectTarget(month));
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

		redirect(302, monthRedirectTarget(month));
	},
	delete: async ({ request, locals }) => {
		const formData = await request.formData();
		const month = String(formData.get('month') ?? '');
		const parsed = deleteMealSchema.safeParse({
			id: formData.get('id')
		});

		if (!parsed.success) {
			return fail(400, { errors: parsed.error.flatten().fieldErrors });
		}

		await locals.mealPlanService.deletePlannedMeal(locals.user!.id, parsed.data.id);
		redirect(302, monthRedirectTarget(month));
	},
	scheduleIdea: async ({ request, locals }) => {
		const formData = await request.formData();
		const month = String(formData.get('month') ?? '');
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
		redirect(302, monthRedirectTarget(month));
	}
};
