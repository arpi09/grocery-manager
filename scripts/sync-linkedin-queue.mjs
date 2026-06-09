#!/usr/bin/env node
/**
 * Optional: push a markdown draft to POST /api/admin/social-posts.
 *
 * Usage:
 *   ADMIN_ORIGIN=http://localhost:5173 ADMIN_SESSION_COOKIE="..." node scripts/sync-linkedin-queue.mjs docs/LINKEDIN_REPOST.md
 *
 * Extracts the first LinkedIn "Brödtext" block and primary UTM link from the repost kit.
 */

import { readFileSync } from 'node:fs';

const origin = (process.env.ADMIN_ORIGIN ?? 'http://localhost:5173').replace(/\/$/, '');
const cookie = process.env.ADMIN_SESSION_COOKIE?.trim();
const markdownPath = process.argv[2] ?? 'docs/LINKEDIN_REPOST.md';

if (!cookie) {
	console.error('Set ADMIN_SESSION_COOKIE to an admin session auth cookie.');
	process.exit(1);
}

const markdown = readFileSync(markdownPath, 'utf8');
const bodyMatch = markdown.match(/### Brödtext\s+>\s+([\s\S]*?)(?=\n###|\n---|\n##|$)/);
const urlMatch = markdown.match(/https:\/\/skaffu\.com\/[^\s|)]+utm_source=linkedin[^\s|)]+/);

if (!bodyMatch) {
	console.error('Could not find ### Brödtext block in', markdownPath);
	process.exit(1);
}

const body = bodyMatch[1]
	.split('\n')
	.map((line) => line.replace(/^>\s?/, '').trim())
	.filter(Boolean)
	.join('\n')
	.replace(/\nhttps:\/\/skaffu\.com\/[^\s]+/, '')
	.trim();

const linkUrl = urlMatch?.[0]?.split('?')[0] ?? 'https://skaffu.com/';
const params = urlMatch ? new URL(urlMatch[0]).searchParams : new URLSearchParams();

const payload = {
	body,
	linkUrl,
	utmSource: params.get('utm_source') ?? 'linkedin',
	utmMedium: params.get('utm_medium') ?? 'social',
	utmCampaign: params.get('utm_campaign') ?? 'growth_repost',
	utmContent: params.get('utm_content') ?? 'post_a',
	title: `Sync from ${markdownPath}`,
	source: 'automation'
};

const response = await fetch(`${origin}/api/admin/social-posts`, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		Cookie: cookie
	},
	body: JSON.stringify(payload)
});

const text = await response.text();
if (!response.ok) {
	console.error(`API error ${response.status}:`, text);
	process.exit(1);
}

console.log(text);
