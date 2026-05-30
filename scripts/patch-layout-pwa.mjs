import fs from "fs";
const p = "src/routes/+layout.svelte";
let c = fs.readFileSync(p, "utf8");
const oldDerived = "const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');";
const newDerived = "const webManifest = $derived(pwaInfo?.webManifest);";
if (!c.includes(oldDerived)) throw new Error("derived pattern missing");
c = c.replace(oldDerived, newDerived);
const headRe = /<svelte:head>\s*\{@html webManifestLink\}\s*<\/svelte:head>/s;
const newHead = `<svelte:head>
	{#if webManifest}
		<link rel="manifest" href={webManifest.href} crossorigin={webManifest.useCredentials ? 'use-credentials' : undefined} />
	{/if}
</svelte:head>`;
if (!headRe.test(c)) throw new Error("head pattern missing");
c = c.replace(headRe, newHead);
fs.writeFileSync(p, c, "utf8");
console.log("ok");