const fs = require('fs');
const files = ['e2e/navigation.spec.ts', 'e2e/admin.spec.ts'];
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
  fs.writeFileSync(f, t, 'utf8');
}
const authPath = 'e2e/helpers/auth.ts';
let auth = fs.readFileSync(authPath, 'utf8');
const loginBlock = `await Promise.all([
		page.waitForURL((url) => url.pathname === '/hem', { timeout: 20_000, waitUntil: 'commit' }),
		page.getByTestId('login-submit').click()
	]);`;
const loginFix = `await page.getByTestId('login-submit').click();
	await page.waitForURL((url) => url.pathname === '/hem', { timeout: 30_000, waitUntil: 'commit' });`;
auth = auth.replace(loginBlock, loginFix);
const regBlock = `await Promise.all([
		page.waitForURL((url) => url.pathname === '/hem', { timeout: 20_000, waitUntil: 'commit' }),
		page.getByTestId('register-submit').click()
	]);`;
const regFix = `await page.getByTestId('register-submit').click();
	await page.waitForURL((url) => url.pathname === '/hem', { timeout: 30_000, waitUntil: 'commit' });`;
auth = auth.replace(regBlock, regFix);
fs.writeFileSync(authPath, auth);
console.log('patched', auth.includes('login-submit').click() ? 'login ok' : 'login miss');
