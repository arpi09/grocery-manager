#!/usr/bin/env node
/**
 * Generate GitHub Release notes between PREVIOUS_TAG and DEPLOY_SHA.
 *
 * Env:
 *   DEPLOY_SHA (required)
 *   PREVIOUS_TAG (optional — latest release tag if unset)
 *   GITHUB_REPOSITORY (optional — gh CLI default)
 *   OUTPUT_FILE (optional — default stdout)
 *
 * Usage: npm run release:notes
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const deploySha = process.env.DEPLOY_SHA;
const outputFile = process.env.OUTPUT_FILE;

if (!deploySha) {
	console.error('DEPLOY_SHA is required');
	process.exit(1);
}

/** @param {string} args */
function gh(args) {
	return execSync(`gh ${args}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

/** @param {string} title @returns {'Added' | 'Fixed' | 'Changed'} */
function categorize(title) {
	const lower = title.trim().toLowerCase();
	if (lower.startsWith('fix:') || lower.startsWith('fix(')) return 'Fixed';
	if (lower.startsWith('feat:') || lower.startsWith('feat(')) return 'Added';
	return 'Changed';
}

/** @returns {string} */
function resolvePreviousTag() {
	if (process.env.PREVIOUS_TAG) return process.env.PREVIOUS_TAG;
	try {
		const tag = gh('release list --limit 1 --json tagName --jq ".[0].tagName // empty"');
		return tag || '';
	} catch {
		return '';
	}
}

/** @param {string} tag */
function tagTargetSha(tag) {
	if (!tag) return '';
	try {
		return gh(`api repos/{owner}/{repo}/git/ref/tags/${tag} --jq .object.sha`).slice(0, 40);
	} catch {
		try {
			return gh(`api repos/{owner}/{repo}/releases/tags/${tag} --jq .target_commitish`).slice(
				0,
				40
			);
		} catch {
			return '';
		}
	}
}

/** @returns {Array<{number: number, title: string, url: string}>} */
function listMergedPrs(sinceSha, untilSha) {
	const base = sinceSha || untilSha;
	const range = sinceSha ? `${sinceSha}..${untilSha}` : untilSha;
	let json = '[]';
	try {
		json = gh(
			`pr list --state merged --base master --limit 100 --json number,title,url,mergeCommit,mergedAt`
		);
	} catch {
		return [];
	}

	/** @type {Array<{number: number, title: string, url: string, mergeCommit?: {oid: string}}>} */
	const prs = JSON.parse(json);
	return prs.filter((pr) => {
		const oid = pr.mergeCommit?.oid;
		if (!oid) return false;
		if (!sinceSha) return oid === untilSha.slice(0, 40);
		try {
			execSync(`git merge-base --is-ancestor ${sinceSha} ${oid}`, { stdio: 'ignore' });
			execSync(`git merge-base --is-ancestor ${oid} ${untilSha}`, { stdio: 'ignore' });
			return true;
		} catch {
			return false;
		}
	});
}

const previousTag = resolvePreviousTag();
const sinceSha = previousTag ? tagTargetSha(previousTag) : '';

let prs = [];
try {
	execSync('git rev-parse --verify HEAD', { stdio: 'ignore' });
	prs = listMergedPrs(sinceSha, deploySha);
} catch {
	// gh-only fallback when git range unavailable
	const json = gh(
		`pr list --state merged --base master --limit 30 --json number,title,url,mergeCommit`
	);
	prs = JSON.parse(json).filter(
		(/** @type {{mergeCommit?: {oid: string}}} */ pr) =>
			pr.mergeCommit?.oid?.startsWith(deploySha.slice(0, 7)) ||
			pr.mergeCommit?.oid === deploySha
	);
}

/** @type {Record<'Added' | 'Fixed' | 'Changed', string[]>} */
const groups = { Added: [], Fixed: [], Changed: [] };
for (const pr of prs) {
	const section = categorize(pr.title);
	groups[section].push(`- ${pr.title} ([#${pr.number}](${pr.url}))`);
}

const shortSha = deploySha.slice(0, 8);
const lines = [
	`Deploy \`${shortSha}\`${previousTag ? ` (since \`${previousTag}\`)` : ''}.`,
	'',
	'### Added',
	...(groups.Added.length ? groups.Added : ['- _None_']),
	'',
	'### Fixed',
	...(groups.Fixed.length ? groups.Fixed : ['- _None_']),
	'',
	'### Changed',
	...(groups.Changed.length ? groups.Changed : ['- _None_']),
	'',
	`Full commit: https://github.com/${process.env.GITHUB_REPOSITORY ?? 'OWNER/REPO'}/commit/${deploySha}`
];

const body = lines.join('\n');

if (outputFile) {
	writeFileSync(outputFile, body);
	console.log(`Wrote ${outputFile}`);
} else {
	process.stdout.write(body);
}
