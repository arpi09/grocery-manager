#!/usr/bin/env node
/**
 * Append one rollup line under [Unreleased] / Changed for merged Dependabot PRs (last 30 days).
 *
 * Requires GH_TOKEN (GitHub Actions) or gh CLI auth locally.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const CHANGELOG_PATH = 'docs/CHANGELOG.md';
const REPO = process.env.GITHUB_REPOSITORY ?? 'arpi09/grocery-manager';

function listMergedDepsPrs() {
	const since = new Date();
	since.setDate(since.getDate() - 30);
	const sinceIso = since.toISOString().slice(0, 10);

	const json = execSync(
		`gh pr list --repo ${REPO} --state merged --label dependencies --limit 100 --json number,title,mergedAt,url`,
		{ encoding: 'utf8' }
	);
	/** @type {{ number: number; title: string; mergedAt: string; url: string }[]} */
	const prs = JSON.parse(json);
	return prs
		.filter((pr) => pr.mergedAt && pr.mergedAt.slice(0, 10) >= sinceIso)
		.sort((a, b) => a.number - b.number);
}

const prs = listMergedDepsPrs();
if (prs.length === 0) {
	console.log('No merged dependency PRs in the last 30 days — skipping.');
	process.exit(0);
}

const prLinks = prs.map((pr) => `[#${pr.number}](${pr.url})`).join(', ');
const bullet = `- Dependencies: npm production + dev minor/patch bumps (${prLinks}) — see merged PRs`;

let changelog = readFileSync(CHANGELOG_PATH, 'utf8');
const unreleasedMarker = '## [Unreleased]';
const unreleasedIdx = changelog.indexOf(unreleasedMarker);
if (unreleasedIdx === -1) {
	console.error(`Missing ${unreleasedMarker} in ${CHANGELOG_PATH}`);
	process.exit(1);
}

const rollupPrefix = '- Dependencies: npm production + dev minor/patch bumps';
if (changelog.includes(rollupPrefix)) {
	const sectionHeader = '### Changed';
	const sectionIdx = changelog.indexOf(sectionHeader, unreleasedIdx);
	if (sectionIdx !== -1) {
		const afterSection = sectionIdx + sectionHeader.length;
		const nextHeading = changelog.indexOf('\n### ', afterSection);
		const sectionBody = changelog.slice(afterSection, nextHeading === -1 ? changelog.length : nextHeading);
		if (sectionBody.includes(rollupPrefix)) {
			console.log('Monthly rollup line already present under [Unreleased] / Changed — skipping.');
			process.exit(0);
		}
	}
}

const sectionHeader = '### Changed';
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
console.log(`Appended monthly deps rollup (${prs.length} PRs).`);
