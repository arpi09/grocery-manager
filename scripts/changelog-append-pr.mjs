#!/usr/bin/env node
/**
 * Append a merged PR entry under docs/CHANGELOG.md [Unreleased].
 *
 * Env: PR_NUMBER, PR_TITLE, PR_URL (optional PR_BODY)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const CHANGELOG_PATH = 'docs/CHANGELOG.md';

const prNumber = process.env.PR_NUMBER;
const prTitle = process.env.PR_TITLE ?? '';
const prUrl = process.env.PR_URL ?? '';
const prBody = process.env.PR_BODY ?? '';
const prLabelsRaw = process.env.PR_LABELS ?? '';

if (!prNumber || !prTitle) {
	console.error('PR_NUMBER and PR_TITLE are required');
	process.exit(1);
}

const normalized = prTitle.trim();
const prLabels = prLabelsRaw
	.split(',')
	.map((label) => label.trim())
	.filter(Boolean);
const isDepsPr =
	prLabels.includes('dependencies') ||
	/^chore\(deps\)/i.test(normalized);

if (isDepsPr) {
	console.log('Dependency PR — skipping per-PR CHANGELOG (monthly rollup applies).');
	process.exit(0);
}
const lower = normalized.toLowerCase();
/** @type {'Added' | 'Fixed' | 'Changed'} */
let section = 'Changed';
if (lower.startsWith('fix:') || lower.startsWith('fix(')) {
	section = 'Fixed';
} else if (lower.startsWith('feat:') || lower.startsWith('feat(')) {
	section = 'Added';
}

const link = prUrl ? `[#${prNumber}](${prUrl})` : `#${prNumber}`;
const summaryLine = prBody
	.split('\n')
	.map((line) => line.trim())
	.find((line) => line.startsWith('- ') && line.length > 2);
const detail = summaryLine ? ` — ${summaryLine.slice(2)}` : '';
const bullet = `- ${normalized} (${link})${detail}`;

let changelog = readFileSync(CHANGELOG_PATH, 'utf8');
const unreleasedMarker = '## [Unreleased]';
const unreleasedIdx = changelog.indexOf(unreleasedMarker);
if (unreleasedIdx === -1) {
	console.error(`Missing ${unreleasedMarker} in ${CHANGELOG_PATH}`);
	process.exit(1);
}

if (changelog.includes(`(${link})`)) {
	console.log('Entry already present — skipping');
	process.exit(0);
}

const sectionHeader = `### ${section}`;
const sectionIdx = changelog.indexOf(sectionHeader, unreleasedIdx);
if (sectionIdx === -1) {
	console.error(`Missing ${sectionHeader} under [Unreleased]`);
	process.exit(1);
}

const afterSection = sectionIdx + sectionHeader.length;
const nextHeading = changelog.indexOf('\n### ', afterSection);
const insertAt = nextHeading === -1 ? changelog.length : nextHeading;

const before = changelog.slice(0, insertAt).replace(/\s*$/, '');
const after = changelog.slice(insertAt);
const updated = `${before}\n${bullet}\n${after.startsWith('\n') ? after : `\n${after}`}`;

writeFileSync(CHANGELOG_PATH, updated);
console.log(`Appended to [Unreleased] / ${section}: ${normalized}`);
