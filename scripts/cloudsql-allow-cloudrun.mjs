import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const projectId = 'home-pantry-4bee5';
const instance = 'home-pantry-4bee5-instance';

const config = JSON.parse(
	readFileSync(join(homedir(), '.config', 'configstore', 'firebase-tools.json'), 'utf8')
);
const token = config.tokens?.access_token;
if (!token) {
	console.error('No Firebase access token');
	process.exit(1);
}

const headers = {
	Authorization: `Bearer ${token}`,
	'Content-Type': 'application/json'
};

const getRes = await fetch(
	`https://sqladmin.googleapis.com/v1/projects/${projectId}/instances/${instance}`,
	{ headers }
);
if (!getRes.ok) {
	console.error('get instance failed', getRes.status, await getRes.text());
	process.exit(1);
}

const instanceBody = await getRes.json();
const networks = instanceBody.settings?.ipConfiguration?.authorizedNetworks ?? [];
const hasOpen = networks.some((n) => n.value === '0.0.0.0/0');
if (!hasOpen) {
	networks.push({ value: '0.0.0.0/0', name: 'apphosting-cloud-run' });
}

const patchBody = {
	settings: {
		ipConfiguration: {
			ipv4Enabled: true,
			authorizedNetworks: networks
		}
	}
};

const patchRes = await fetch(
	`https://sqladmin.googleapis.com/v1/projects/${projectId}/instances/${instance}?updateMask=settings.ipConfiguration`,
	{ method: 'PATCH', headers, body: JSON.stringify(patchBody) }
);
if (!patchRes.ok) {
	console.error('patch instance failed', patchRes.status, await patchRes.text());
	process.exit(1);
}

console.log('Cloud SQL public IP authorized networks updated (includes 0.0.0.0/0 for Cloud Run egress).');
