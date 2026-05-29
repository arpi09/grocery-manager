import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const projectId = 'home-pantry-4bee5';
const role = 'roles/cloudsql.client';
const members = [
	'serviceAccount:459524831747-compute@developer.gserviceaccount.com',
	'serviceAccount:service-459524831747@gcp-sa-firebaseapphosting.iam.gserviceaccount.com'
];

const config = JSON.parse(
	readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8')
);
const token = config.tokens?.access_token;
if (!token) {
	console.error('No Firebase access token; run: npx firebase login');
	process.exit(1);
}

const headers = {
	Authorization: `Bearer ${token}`,
	'Content-Type': 'application/json'
};

const policyRes = await fetch(
	`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy`,
	{ method: 'POST', headers, body: JSON.stringify({}) }
);
if (!policyRes.ok) {
	console.error('getIamPolicy failed', policyRes.status, await policyRes.text());
	process.exit(1);
}

const policy = await policyRes.json();
policy.bindings ??= [];

for (const member of members) {
	let binding = policy.bindings.find((b) => b.role === role);
	if (!binding) {
		binding = { role, members: [] };
		policy.bindings.push(binding);
	}
	if (!binding.members.includes(member)) {
		binding.members.push(member);
	}
}

const setRes = await fetch(
	`https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:setIamPolicy`,
	{
		method: 'POST',
		headers,
		body: JSON.stringify({ policy })
	}
);
if (!setRes.ok) {
	console.error('setIamPolicy failed', setRes.status, await setRes.text());
	process.exit(1);
}

console.log('Granted', role, 'to:', members.join(', '));
