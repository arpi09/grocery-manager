#!/usr/bin/env node
/**
 * Sync Cursor AI config → Claude Code (.claude/).
 * Source of truth: .cursor/agents, .cursor/skills, allowlisted .cursor/rules/*.mdc
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const RULE_ALLOWLIST = [
	'dev-server-auto-restart.mdc',
	'personal-cost-always.mdc',
	'skaffu-core-loop.mdc',
	'skaffu-frozen-zones.mdc',
	'deploy-safety.mdc'
];

const DEV_RUNTIME_CLAUDE_BODY = `---
name: dev-runtime
description: >-
  Dev server operator for home-pantry. Keeps npm run dev:watch running,
  restarts on .env/hooks/DB changes, runs dev:health. Use proactively after
  env or database changes.
---

You are the **Dev runtime** agent for Home Pantry.

## Workspace

- Primary folder: project root (or sibling worktree \`home-pantry-dev\` on Windows)
- Read charter: \`AGENTS-DEV-RUNTIME.md\`

## Job

1. Keep the app dev server running with auto-restart — **never ask the user to restart manually**.
2. Default (all platforms):

   \`\`\`bash
   npm run dev
   \`\`\`

   Auto-restart on env/hooks/DB changes:

   \`\`\`bash
   npm run dev:watch
   \`\`\`

   Windows worktrees (optional): \`npm run dev:start:ai\`

3. After env / hooks / DB changes, verify:

   \`\`\`bash
   npm run dev:health
   \`\`\`

4. Only escalate if port 5173 is blocked or the server crashes on boot.

## Scope

Only touch: \`scripts/dev-runtime/**\`, \`nodemon.dev.json\`, dev scripts in \`package.json\`, dev sections in \`README.md\` / \`docs/AI_TOOLING.md\`.

Do **not** edit product routes, admin, AI features, or tests.
`;

function stripMdcFrontmatter(content) {
	if (!content.startsWith('---')) return content;
	const end = content.indexOf('---', 3);
	if (end === -1) return content;
	return content.slice(end + 3).trimStart();
}

function syncAgents() {
	const src = join(root, '.cursor/agents');
	const dest = join(root, '.claude/agents');
	mkdirSync(dest, { recursive: true });

	for (const file of readdirSync(src)) {
		if (!file.endsWith('.md')) continue;
		const out = join(dest, file);
		if (file === 'dev-runtime.md') {
			writeFileSync(out, DEV_RUNTIME_CLAUDE_BODY, 'utf8');
			continue;
		}
		cpSync(join(src, file), out);
	}
	console.log('Synced .cursor/agents → .claude/agents');
}

function syncSkills() {
	const src = join(root, '.cursor/skills');
	const dest = join(root, '.claude/skills');

	for (const dir of readdirSync(src, { withFileTypes: true })) {
		if (!dir.isDirectory()) continue;
		const skillSrc = join(src, dir.name);
		const skillFile = join(skillSrc, 'SKILL.md');
		if (!existsSync(skillFile)) continue;
		const skillDest = join(dest, dir.name);
		mkdirSync(skillDest, { recursive: true });
		cpSync(skillFile, join(skillDest, 'SKILL.md'));
	}
	console.log('Synced .cursor/skills → .claude/skills');
}

function syncRules() {
	const srcDir = join(root, '.cursor/rules');
	const destDir = join(root, '.claude/rules');
	mkdirSync(destDir, { recursive: true });

	for (const file of RULE_ALLOWLIST) {
		const src = join(srcDir, file);
		if (!existsSync(src)) {
			console.warn(`Skip missing rule: ${file}`);
			continue;
		}
		const md = stripMdcFrontmatter(readFileSync(src, 'utf8'));
		const outName = file.replace(/\.mdc$/, '.md');
		writeFileSync(join(destDir, outName), md, 'utf8');
	}
	console.log('Synced allowlisted .cursor/rules → .claude/rules');
}

function ensureClaudeSettings() {
	const settingsPath = join(root, '.claude/settings.json');
	if (existsSync(settingsPath)) return;
	mkdirSync(join(root, '.claude'), { recursive: true });
	writeFileSync(
		settingsPath,
		JSON.stringify({ env: { USE_PGLITE: 'true' } }, null, '\t') + '\n',
		'utf8'
	);
	console.log('Created .claude/settings.json (dev defaults only)');
}

function main() {
	if (!existsSync(join(root, 'CLAUDE.md'))) {
		console.error('Missing CLAUDE.md — commit it before sync.');
		process.exit(1);
	}
	syncAgents();
	syncSkills();
	syncRules();
	ensureClaudeSettings();
	console.log('\nAI tooling sync complete. Run: npm run verify:ai-tooling');
}

main();
