/**
 * Generate design/FLOWS/*.md flow galleries with ordered steps and mermaid.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FLOWS_DIR, generatedHeader, ensureDir, isDirectScriptRun } from './shared.ts';

interface FlowStep {
	order: number;
	title: string;
	route: string;
	screen?: string;
	source?: string;
}

interface FlowDefinition {
	id: string;
	title: string;
	summary: string;
	steps: FlowStep[];
	mermaid: string;
}

const FLOWS: FlowDefinition[] = [
	{
		id: 'onboarding',
		title: 'Onboarding',
		summary: 'Register → activation modal → scan → inköpslista',
		mermaid: `flowchart LR
  Register[Register/OAuth]
  Modal[ActivationOnboardingFlow]
  Scan[/scan]
  Inkop[/inkop?quick=1]
  Register --> Modal
  Modal -->|"Scan step"| Scan
  Modal -->|"Complete"| Inkop`,
		steps: [
			{ order: 1, title: 'Register or OAuth', route: '/register', source: 'src/routes/register/+page.svelte' },
			{ order: 2, title: 'Welcome on hem', route: '/hem?welcome=1', source: 'src/routes/hem/+page.svelte' },
			{ order: 3, title: 'Activation onboarding modal', route: '/hem', screen: 'start-guide', source: 'src/lib/components/organisms/ActivationOnboardingFlow.svelte' },
			{ order: 4, title: 'Scan hub', route: '/scan', source: 'src/routes/scan/+page.svelte' },
			{ order: 5, title: 'First shopping list', route: '/inkop?quick=1', source: 'src/lib/components/organisms/ShoppingV2Page.svelte' },
			{ order: 6, title: 'PWA install wedge (optional)', route: '/install-app', source: 'src/routes/install-app/+page.svelte' }
		]
	},
	{
		id: 'receipt',
		title: 'Receipt import',
		summary: 'Scan hub → upload → review → success → pantry',
		mermaid: `flowchart LR
  Hub[/scan/kvitto]
  Parse[API receipt-parse]
  Review[ReceiptBulkAddFlow]
  Success[ReceiptImportSuccessMoment]
  Pantry[/inventory]
  Hub --> Parse
  Parse --> Review
  Review --> Success
  Review --> Pantry`,
		steps: [
			{ order: 1, title: 'Receipt upload', route: '/scan/kvitto', screen: 'receipt-upload', source: 'src/routes/scan/kvitto/+page.server.ts' },
			{ order: 2, title: 'Parse & review lines', route: '/scan/kvitto', screen: 'receipt-review', source: 'src/lib/components/organisms/ReceiptBulkAddFlow.svelte' },
			{ order: 3, title: 'Import success moment', route: '/scan/kvitto', screen: 'receipt-success', source: 'src/lib/components/organisms/ReceiptImportSuccessMoment.svelte' },
			{ order: 4, title: 'Pantry updated', route: '/inventory', screen: 'pantry', source: 'src/lib/components/organisms/PantryV2Page.svelte' }
		]
	},
	{
		id: 'shopping',
		title: 'Shopping',
		summary: 'Plan → shop trip → checkoff → pantry replenishment',
		mermaid: `flowchart LR
  Plan[/inkop plan]
  Shop[/inkop shop]
  Checkoff[Pick item]
  Pantry[shopping-to-pantry]
  Plan --> Shop
  Shop --> Checkoff
  Checkoff --> Pantry`,
		steps: [
			{ order: 1, title: 'Shopping plan', route: '/inkop', screen: 'shopping-plan', source: 'src/lib/components/organisms/ShoppingV2PlanView.svelte' },
			{ order: 2, title: 'Start shop trip', route: '/inkop', screen: 'shopping-trip', source: 'src/lib/components/organisms/ShoppingV2ShopView.svelte' },
			{ order: 3, title: 'Checklist drawer (legacy grid)', route: '/inkop', source: 'src/lib/components/organisms/ShoppingChecklistDataGrid.svelte' },
			{ order: 4, title: 'Trip complete', route: '/inkop', screen: 'success-states', source: 'src/lib/components/organisms/ShoppingV2Page.svelte' },
			{ order: 5, title: 'Empty shopping list', route: '/inkop', screen: 'empty-shopping', source: 'src/lib/components/molecules/EmptyState.svelte' }
		]
	},
	{
		id: 'pantry',
		title: 'Pantry',
		summary: 'Shelf view → consume → expiry → eat-first',
		mermaid: `flowchart LR
  Shelf[/inventory/location]
  Consume[One-tap consume]
  Expiry[Expiry badges]
  EatFirst[Home eat-first]
  Shelf --> Consume
  Shelf --> Expiry
  Expiry --> EatFirst`,
		steps: [
			{ order: 1, title: 'Pantry overview', route: '/inventory', screen: 'pantry', source: 'src/lib/components/organisms/PantryV2Page.svelte' },
			{ order: 2, title: 'Location shelf', route: '/inventory/fridge', source: 'src/lib/components/organisms/PantryV2ShelfView.svelte' },
			{ order: 3, title: 'Empty pantry', route: '/inventory', screen: 'empty-pantry', source: 'src/lib/components/organisms/PantryV2EmptyState.svelte' },
			{ order: 4, title: 'Eat-first on hem', route: '/hem', source: 'src/lib/components/organisms/HomeRedesignDashboard.svelte' }
		]
	},
	{
		id: 'store-recommendation',
		title: 'Store recommendation (V0)',
		summary: 'Telemetry-only today — no public UI surface wired',
		mermaid: `flowchart LR
  Home[/hem]
  Inkop[/inkop plan]
  Telemetry[product_event]
  Home -.->|"flag off"| Telemetry
  Inkop -.-> Telemetry`,
		steps: [
			{ order: 1, title: 'Domain & telemetry', route: '—', source: 'src/lib/domain/store-recommendation.ts' },
			{ order: 2, title: 'Feature flag (off in prod)', route: '—', source: 'src/lib/server/feature-flags.ts' },
			{ order: 3, title: 'Future: /butik/[token]', route: '—', source: 'docs/ACQUISITION_LOOPS_V1.md' }
		]
	}
];

function renderFlow(flow: FlowDefinition): string {
	const lines = [
		generatedHeader('scripts/design-kit/build-flow-gallery.ts'),
		`# Flow: ${flow.title}`,
		'',
		flow.summary,
		'',
		'## Diagram',
		'',
		'```mermaid',
		flow.mermaid,
		'```',
		'',
		'## Steps',
		'',
		'| # | Step | Route | Screenshot | Source |',
		'|---|------|-------|------------|--------|'
	];

	for (const step of flow.steps) {
		const shot = step.screen ? `[${step.screen}](../SCREENSHOTS/${step.screen}.png)` : '—';
		lines.push(`| ${step.order} | ${step.title} | \`${step.route}\` | ${shot} | \`${step.source ?? '—'}\` |`);
	}

	lines.push('', '---', '', 'See also: [DESIGN.md](../DESIGN.md) · [index.md](./index.md)', '');
	return lines.join('\n');
}

export function buildFlowGallery(): void {
	ensureDir(FLOWS_DIR);

	const indexLines = [
		generatedHeader('scripts/design-kit/build-flow-gallery.ts'),
		'# Flow gallery',
		'',
		'Ordered user flows for AI design tools. Screenshots in [`../SCREENSHOTS/`](../SCREENSHOTS/).',
		'',
		'| Flow | Summary |',
		'|------|---------|'
	];

	for (const flow of FLOWS) {
		writeFileSync(join(FLOWS_DIR, `${flow.id}.md`), renderFlow(flow), 'utf8');
		indexLines.push(`| [${flow.title}](./${flow.id}.md) | ${flow.summary} |`);
	}

	indexLines.push('', 'Regenerate: `npm run design:build`.', '');
	writeFileSync(join(FLOWS_DIR, 'index.md'), indexLines.join('\n'), 'utf8');
	console.log(`Wrote ${FLOWS.length} flow files to design/FLOWS/`);
}

if (isDirectScriptRun()) {
	buildFlowGallery();
}
