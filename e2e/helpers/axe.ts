import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const AXE_WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag22aa'] as const;

export type AxeSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AxeViolationSummary {
	id: string;
	impact: AxeSeverity;
	description: string;
	help: string;
	nodes: number;
}

export interface AxeRouteResult {
	critical: number;
	serious: number;
	moderate: number;
	minor: number;
	violations: AxeViolationSummary[];
}

function summarizeViolations(
	violations: Array<{
		id: string;
		impact?: string | null;
		description: string;
		help: string;
		nodes: Array<unknown>;
	}>
): AxeRouteResult {
	const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
	const summaries: AxeViolationSummary[] = [];

	for (const violation of violations) {
		const impact = (violation.impact ?? 'minor') as AxeSeverity;
		if (impact in counts) {
			counts[impact] += 1;
		}
		summaries.push({
			id: violation.id,
			impact,
			description: violation.description,
			help: violation.help,
			nodes: violation.nodes.length
		});
	}

	return { ...counts, violations: summaries };
}

export async function analyzePageA11y(page: Page): Promise<AxeRouteResult> {
	const results = await new AxeBuilder({ page }).withTags([...AXE_WCAG_TAGS]).analyze();
	return summarizeViolations(results.violations);
}

export async function expectNoCriticalOrSeriousViolations(page: Page, routeLabel: string) {
	const summary = await analyzePageA11y(page);
	const blocking = summary.violations.filter(
		(v) => v.impact === 'critical' || v.impact === 'serious'
	);

	expect(
		blocking,
		`${routeLabel}: expected 0 critical/serious axe violations (wcag22aa), found ${blocking.length}:\n${JSON.stringify(blocking, null, 2)}`
	).toHaveLength(0);
}
