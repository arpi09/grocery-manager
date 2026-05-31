const fs = require('fs');
const p = 'src/lib/components/organisms/MainNavMobile.svelte';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/\n\timport \{ subscribeNarrowViewport \} from '\$lib\/utils\/use-narrow-viewport';/, '');
c = c.replace(/\n\tlet isNarrowViewport = \$state\(false\);\n\n\t\$effect\(\(\) =>\n\t\tsubscribeNarrowViewport\(\(matches\) => \{\n\t\t\tisNarrowViewport = matches;\n\t\t\}\)\n\t\);/, '');
fs.writeFileSync(p, c);
