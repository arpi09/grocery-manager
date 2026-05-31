import fs from "fs";
const p = "src/routes/+layout.svelte";
let c = fs.readFileSync(p, "utf8");
c = c.replace(
  "const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');",
  "const webManifest = $derived(pwaInfo?.webManifest);"
);
c = c.replace(
  /<svelte:head>\s*\{@html webManifestLink\}\s*<\/svelte:head>/s,
  `<svelte:head>
	{#if webManifest}
		<link rel="manifest" href={webManifest.href} crossorigin={webManifest.useCredentials ? 'use-credentials' : undefined} />
	{/if}
</svelte:head>`
);
fs.writeFileSync(p, c);
