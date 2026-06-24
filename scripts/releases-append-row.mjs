#!/usr/bin/env node
/**
 * Append a row to docs/RELEASES.md after successful deploy.
 *
 * Env: CALVER_TAG, DEPLOY_SHA, DEPLOY_RUN_URL, PR_LIST (optional, comma-separated #123)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const tag = process.env.CALVER_TAG;
const sha = process.env.DEPLOY_SHA;
const runUrl = process.env.DEPLOY_RUN_URL ?? '';
const prList = process.env.PR_LIST ?? '—';

if (!tag || !sha) {
	console.error('CALVER_TAG and DEPLOY_SHA are required');
	process.exit(1);
}

const path = 'docs/RELEASES.md';
const shortSha = sha.slice(0, 9);
const repo =
	process.env.GITHUB_REPOSITORY ??
	(process.env.GH_REPO ? process.env.GH_REPO : 'arpi09/grocery-manager');
const releaseUrl = `https://github.com/${repo}/releases/tag/${tag}`;
const runCell = runUrl ? `[${runUrl.split('/').pop()}](${runUrl})` : '—';
const row = `| [${tag}](${releaseUrl}) | \`${shortSha}\` | ${runCell} | ${prList} |`;

let content = readFileSync(path, 'utf8');
if (content.includes(`| \`${shortSha}\` |`) || content.includes(`\`${shortSha}\``)) {
	console.log('Row already present — skipping');
	process.exit(0);
}

const header = '| CalVer | Prod SHA | Deploy run | PRs |';
const headerIdx = content.indexOf(header);
if (headerIdx === -1) {
	console.error('Missing RELEASES table header');
	process.exit(1);
}

const separatorEnd = content.indexOf('\n', content.indexOf('|--------', headerIdx));
const insertAt = separatorEnd === -1 ? content.length : separatorEnd + 1;
content = `${content.slice(0, insertAt)}\n${row}${content.slice(insertAt)}`;

writeFileSync(path, content);
console.log(`Appended release row: ${tag} @ ${shortSha}`);
