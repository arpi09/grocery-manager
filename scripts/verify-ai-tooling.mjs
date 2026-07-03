#!/usr/bin/env node
/**
 * Verify Claude + Cursor AI tooling files exist after setup/sync.
 */
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

function requirePath(rel, label = rel) {
	const full = join(root, rel);
	if (!existsSync(full)) errors.push(`Missing ${label}: ${rel}`);
	return full;
}

function requireDirWithFiles(dirRel, minFiles, label) {
	const full = requirePath(dirRel, label);
	if (!existsSync(full)) return;
	const files = readdirSync(full);
	if (files.length < minFiles) {
		errors.push(`${label} has ${files.length} file(s), expected at least ${minFiles}`);
	}
}

requirePath('CLAUDE.md');
requirePath('AGENTS.md');
requirePath('docs/AI_TOOLING.md');
requirePath('docs/templates/AI_USER_RULES_SNIPPET.md');
requirePath('scripts/sync-ai-tooling.mjs');
requirePath('.cursor/agents/dev-runtime.md');
requirePath('.cursor/agents/e2e.md');

requireDirWithFiles('.claude/agents', 2, '.claude/agents');
requireDirWithFiles('.claude/skills', 4, '.claude/skills');
requireDirWithFiles('.claude/rules', 5, '.claude/rules');

const requiredSkills = [
	'skaffu-deploy-verify',
	'skaffu-core-loop-change',
	'skaffu-release-model',
	'skaffu-prod-error-autofix'
];
for (const skill of requiredSkills) {
	requirePath(`.claude/skills/${skill}/SKILL.md`, `skill ${skill}`);
}

const requiredRules = [
	'dev-server-auto-restart.md',
	'personal-cost-always.md',
	'skaffu-core-loop.md',
	'skaffu-frozen-zones.md',
	'deploy-safety.md'
];
for (const rule of requiredRules) {
	requirePath(`.claude/rules/${rule}`, `rule ${rule}`);
}

if (errors.length > 0) {
	console.error('verify:ai-tooling FAILED:\n');
	for (const e of errors) console.error(`  - ${e}`);
	console.error('\nRun: npm run sync:ai-tooling');
	process.exit(1);
}

console.log('verify:ai-tooling OK');
