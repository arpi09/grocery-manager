/**
 * Classify changed file paths for CI/CD test tiers.
 *
 * Output tier: docs-only | low-risk | core-loop
 */
import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import { stdin } from 'node:process';

const CORE_LOOP_PATTERNS = [
	/src\/routes\/.*\/login\//,
	/register/,
	/onboarding/,
	/src\/lib\/.*\/auth\//,
	/hooks\.server\.ts$/,
	/src\/routes\/.*\/scan\//,
	/receipt/,
	/src\/lib\/.*\/receipt\//,
	/src\/routes\/.*\/inkop\//,
	/shopping/,
	/ShoppingList/,
	/src\/routes\/.*\/inventory\//,
	/src\/lib\/.*\/inventory\//,
	/Inventory/,
	/brain/,
	/shelf-life/,
	/prediction/,
	/replenish/,
	/src\/lib\/infrastructure\/db\//,
	/migrations?\//,
	/drizzle/,
	/stripe/,
	/checkout/,
	/billing/,
	/^apphosting\.yaml$/,
	/^firebase\.json$/,
	/\.github\/workflows\//,
	/^playwright.*\.ts$/,
	/^e2e\//,
	/^src\/hooks\.server\.ts$/,
	/^src\/app\.html$/
];

const DOCS_ONLY_PATTERNS = [/^docs\//, /\.md$/, /^content\/guides\//, /^\.cursor\//];

const LOW_RISK_PATTERNS = [
	/\.css$/,
	/^src\/app\.css$/,
	/^src\/lib\/i18n\//,
	/^messages\//,
	/locale/,
	/^src\/lib\/components\/ui\//
];

function normalizePath(file) {
	return file.trim().replace(/\\/g, '/').replace(/^\.\//, '');
}

function matchesAny(path, patterns) {
	return patterns.some((pattern) => pattern.test(path));
}

function classifyFiles(files) {
	const normalized = files.map(normalizePath).filter((f) => f.length > 0);
	if (normalized.length === 0) return 'low-risk';
	if (normalized.every((path) => matchesAny(path, DOCS_ONLY_PATTERNS))) return 'docs-only';
	if (normalized.some((path) => matchesAny(path, CORE_LOOP_PATTERNS))) return 'core-loop';
	return 'low-risk';
}

function parseFileList(text) {
	return text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0 && !line.startsWith('#'));
}

function readFromGithubEvent() {
	const eventPath = process.env.GITHUB_EVENT_PATH;
	if (!eventPath || !existsSync(eventPath)) {
		throw new Error('GITHUB_EVENT_PATH is not set or file missing');
	}
	const event = JSON.parse(readFileSync(eventPath, 'utf8'));
	const eventName = process.env.GITHUB_EVENT_NAME ?? '';
	if (eventName === 'pull_request') {
		throw new Error('pull_request event lacks file list; pipe filenames from gh api');
	}
	if (eventName === 'push') {
		throw new Error('push event: pass changed files via stdin or CHANGED_FILES');
	}
	return [];
}

function writeOutput(tier, files) {
	console.log(tier);
	const githubOutput = process.env.GITHUB_OUTPUT;
	if (githubOutput) {
		const payload = JSON.stringify({ tier, files });
		appendFileSync(githubOutput, `tier=${tier}\n`);
		appendFileSync(githubOutput, `json=${payload}\n`);
	}
}

async function readStdin() {
	if (stdin.isTTY) return '';
	let data = '';
	stdin.setEncoding('utf8');
	for await (const chunk of stdin) data += chunk;
	return data;
}

async function main() {
	const args = process.argv.slice(2);
	let files = [];

	if (args.includes('--from-github-event')) {
		files = readFromGithubEvent();
	} else if (process.env.CHANGED_FILES) {
		files = parseFileList(process.env.CHANGED_FILES);
	} else if (args.length > 0) {
		files = args.filter((arg) => arg !== '--json').map(normalizePath);
	} else {
		files = parseFileList(await readStdin());
	}

	const tier = classifyFiles(files);
	if (args.includes('--json')) {
		console.log(JSON.stringify({ tier, files }));
	} else {
		writeOutput(tier, files.map(normalizePath));
	}
}

main().catch((err) => {
	console.error(err.message);
	process.exit(1);
});
