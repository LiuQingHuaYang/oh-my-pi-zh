// Scan for untranslated UI strings in the omp source tree.
// Writes the result to untranslated_full.txt (UTF-8) so Windows console
// encoding never corrupts em-dashes etc. Lines are `file|label: "X"` grouped
// by file, ready to paste into patch_omp_zh_v2.py translation lists.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const files = [
  'packages/coding-agent/src/slash-commands/builtin-registry.ts',
  'packages/coding-agent/src/config/settings-schema.ts',
  'packages/coding-agent/src/modes/components/welcome.ts',
  'packages/coding-agent/src/debug/index.ts',
  'packages/tui/src/keybindings.ts',
  'packages/coding-agent/src/config/model-roles.ts',
  'packages/tui/src/components/settings-list.ts',
  'packages/tui/src/components/select-list.ts'
];

function hasChinese(s) {
  return /[\u4e00-\u9fff]/.test(s);
}

const re = /(label|description|name):\s*"((?:[^"\\]|\\.)*)"/g;

const byFile = new Map();
for (const f of files) {
  const abs = path.join(ROOT, f);
  if (!fs.existsSync(abs)) continue;
  const content = fs.readFileSync(abs, 'utf8');
  const seen = new Set();
  const lines = [];
  for (const m of content.matchAll(re)) {
    const prefix = m[1];
    const val = m[2];
    if (hasChinese(val)) continue;
    if (!/^[A-Z0-9]/.test(val)) continue;
    const key = prefix + '|' + val;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`${prefix}: "${val}"`);
  }
  if (lines.length) byFile.set(f, lines);
}

let out = '';
let total = 0;
for (const [f, lines] of byFile) {
  out += `\n### ${f}  (${lines.length})\n`;
  for (const l of lines) {
    out += `    ${l}\n`;
    total++;
  }
}
out += `\nTOTAL: ${total}\n`;

fs.writeFileSync(path.join(ROOT, 'untranslated_full.txt'), out, 'utf8');
console.log(`Wrote ${total} untranslated strings to untranslated_full.txt`);
