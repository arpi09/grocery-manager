import fs from "fs";
import path from "path";

const root = process.cwd();
const srcDir = path.join(root, "src");
const svPath = path.join(srcDir, "lib", "i18n", "locales", "sv.json");

function collectLocaleValues(obj, out = new Set()) {
  for (const v of Object.values(obj)) {
    if (typeof v === "string") out.add(v);
    else if (v && typeof v === "object") collectLocaleValues(v, out);
  }
  return out;
}

const sv = JSON.parse(fs.readFileSync(svPath, "utf8"));
const localeStrings = collectLocaleValues(sv);

const UI_WORDS =
  "Lägg|Spara|Avbryt|Ta bort|Skanna|Hem|Inköp|Tillbaka|Stäng|Mer|Konto|Profil|Logga|Inställningar|Skafferi|Planer|Statistik|Husdjur|Administratör|Skapa|Redigera|Radera|Bekräfta|Fortsätt|Nästa|Föregående|Välj|Sök|Filtrera|Sortera|Ingen|Alla|Ja|Nej|Fel|Varning|Laddar|Tom|Inga|Lägg till|Logga ut|Kontomeny";

const swedishWordRe = new RegExp(
  "(?:^|[\\s,.:;!?])((?:" +
    UI_WORDS +
    ")(?:\\s+[\\p{L}åäöÅÄÖ0-9.,!?-]+)*)",
  "iu"
);

const swedishCharsRe = /[åäöÅÄÖ]/;

function stripComments(code, ext) {
  let out = "";
  let i = 0;
  const n = code.length;
  while (i < n) {
    if (ext === ".svelte" && code.startsWith("<!--", i)) {
      const end = code.indexOf("-->", i + 4);
      i = end === -1 ? n : end + 3;
      continue;
    }
    if (code.startsWith("//", i)) {
      const nl = code.indexOf("\n", i);
      i = nl === -1 ? n : nl;
      continue;
    }
    if (code.startsWith("/*", i)) {
      const end = code.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    const ch = code[i];
    if (ch === "'" || ch === '"' || ch === "`") {
      const q = ch;
      let j = i + 1;
      let esc = false;
      while (j < n) {
        const c = code[j];
        if (esc) {
          esc = false;
          j++;
          continue;
        }
        if (c === "\\") {
          esc = true;
          j++;
          continue;
        }
        if (c === q) {
          j++;
          break;
        }
        j++;
      }
      out += code.slice(i, j);
      i = j;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules") continue;
      walk(p, files);
    } else {
      const rel = path.relative(root, p).replace(/\\/g, "/");
      if (!rel.startsWith("src/")) continue;
      if (ent.name.endsWith(".test.ts")) continue;
      if (
        ent.name.endsWith(".svelte") ||
        (ent.name.endsWith(".ts") && !ent.name.endsWith(".d.ts"))
      ) {
        files.push(p);
      }
    }
  }
  return files;
}

function readStringAt(code, start) {
  const q = code[start];
  let j = start + 1;
  let esc = false;
  while (j < code.length) {
    const c = code[j];
    if (esc) {
      esc = false;
      j++;
      continue;
    }
    if (c === "\\") {
      esc = true;
      j++;
      continue;
    }
    if (c === q) {
      return { literal: code.slice(start, j + 1), end: j + 1 };
    }
    j++;
  }
  return null;
}

function unquote(s) {
  const q = s[0];
  let inner = s.slice(1, -1);
  if (q === "'") return inner.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
  if (q === '"') return inner.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return inner;
}

function isCandidate(str) {
  if (!str || str.length < 2 || str.length > 200) return false;
  if (/^https?:\/\//.test(str)) return false;
  if (/^[a-z0-9_.$/{}-]+$/i.test(str) && !swedishCharsRe.test(str)) return false;
  if (swedishCharsRe.test(str)) return true;
  if (swedishWordRe.test(" " + str + " ")) return true;
  return false;
}

const files = walk(srcDir);
const byFile = new Map();
const globalSeen = new Set();
let totalUnique = 0;
const MAX = 200;

for (const filePath of files.sort()) {
  const rel = path.relative(root, filePath).replace(/\\/g, "/");
  const ext = path.extname(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  const code = stripComments(raw, ext);
  const fileStrings = new Set();
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (ch !== "'" && ch !== '"' && ch !== "`") continue;
    const parsed = readStringAt(code, i);
    if (!parsed) continue;
    i = parsed.end - 1;
    const val = unquote(parsed.literal);
    if (!isCandidate(val)) continue;
    if (localeStrings.has(val)) continue;
    if (!globalSeen.has(val)) {
      if (totalUnique >= MAX) continue;
      globalSeen.add(val);
      totalUnique++;
    }
    fileStrings.add(val);
  }
  if (fileStrings.size) byFile.set(rel, [...fileStrings].sort((a, b) => a.localeCompare(b, "sv")));
}

let md = "";
for (const [rel, strings] of [...byFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  md += "- **" + rel + "** -> [" + strings.map((s) => JSON.stringify(s)).join(", ") + "]\n";
}
md += "\n_Total unique strings (cap " + MAX + "): " + totalUnique + "_\n";
console.log(md || "(none found)");
