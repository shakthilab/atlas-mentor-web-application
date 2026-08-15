/**
 * Scans src/app for every literal string that is plausibly used as a tabler
 * icon name, across several patterns:
 *   - <i-tabler name="foo">
 *   - [name]="cond ? 'foo' : 'bar'"  (and longer ternary/nested chains)
 *   - icon: 'foo'  /  iconName: 'foo'  (object-literal config fields)
 *   - return 'foo';  inside any function whose name contains "Icon"
 * Prints a deduplicated, sorted list of icon slugs and, separately, any
 * `[name]="expr"` binding whose expression isn't a literal/ternary this
 * script could resolve, so those can be checked by hand.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'src', 'app');
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|html)$/.test(entry.name)) files.push(full);
  }
}
walk(SRC);

const icons = new Set();
const unresolved = [];

const STATIC_NAME = /<i-tabler\b[^>]*?\bname="([a-z0-9-]+)"/g;
const DYNAMIC_NAME_ATTR = /\[name\]="([^"]+)"/g;
const LITERAL_IN_EXPR = /'([a-z0-9-]+)'/g;
const OBJECT_ICON_FIELD = /\b(?:icon|iconName)\s*:\s*'([a-z0-9-]+)'/g;
const ICON_FN_RETURN_BLOCK = /(?:get\w*Icon\w*|Icon\w*)\s*\([^)]*\)\s*(?::\s*string\s*)?\{([\s\S]*?)\n  \}/g;
const RETURN_LITERAL = /return\s+'([a-z0-9-]+)'/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');

  let m;
  while ((m = STATIC_NAME.exec(text))) icons.add(m[1]);

  while ((m = OBJECT_ICON_FIELD.exec(text))) icons.add(m[1]);

  while ((m = DYNAMIC_NAME_ATTR.exec(text))) {
    const expr = m[1];
    const literals = [...expr.matchAll(LITERAL_IN_EXPR)].map((x) => x[1]);
    if (literals.length) {
      literals.forEach((l) => icons.add(l));
    } else {
      unresolved.push(`${path.relative(SRC, file)}: [name]="${expr}"`);
    }
  }

  while ((m = ICON_FN_RETURN_BLOCK.exec(text))) {
    const body = m[1];
    let r;
    while ((r = RETURN_LITERAL.exec(body))) icons.add(r[1]);
  }
}

// Manually-verified additions the regex patterns above can't reach (e.g. lookup
// objects keyed by category rather than by an `icon:`/`iconName:` field name) -
// see admin-dashboard.component.ts's `iconMap` (danger/warning/info/secondary -> icon).
const MANUAL_ADDITIONS = ['shield'];
MANUAL_ADDITIONS.forEach((i) => icons.add(i));

function toIconExportName(slug) {
  return 'Icon' + slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

// Validate every candidate against the actual installed package instead of
// trusting the regexes blindly - the `[name]="cond ? 'a' : 'b'"` extraction in
// particular can pick up non-icon string literals (e.g. comparison operands
// like `data.type === 'success'`), which would otherwise silently produce an
// import for an icon that doesn't exist.
const typesFile = path.join(
  __dirname, '..', '..', 'node_modules', 'angular-tabler-icons', 'icons', 'index.d.ts'
);
const validExports = new Set(
  [...fs.readFileSync(typesFile, 'utf8').matchAll(/^export \{ (Icon\w+) \}/gm)].map((m) => m[1])
);

const valid = [];
const rejected = [];
for (const slug of [...icons].sort()) {
  const exportName = toIconExportName(slug);
  if (validExports.has(exportName)) valid.push(slug);
  else rejected.push(`${slug} -> ${exportName} (not found in angular-tabler-icons)`);
}

console.log(`Found ${icons.size} candidate icon names; ${valid.length} validated, ${rejected.length} rejected.`);
console.log(`\nRejected (NOT real tabler icons - likely regex false positives or existing bugs, do not import):`);
rejected.forEach((r) => console.log('  - ' + r));
console.log(`\nUnresolved dynamic [name] bindings (${unresolved.length}) - check these by hand:`);
unresolved.forEach((u) => console.log('  - ' + u));

const exportNames = valid.map(toIconExportName);
console.log(`\n// --- generated: paste into app.module.ts (${exportNames.length} icons) ---`);
console.log(`import {\n  ${exportNames.join(',\n  ')},\n} from 'angular-tabler-icons/icons';`);
console.log(`\nTablerIconsModule.pick({\n  ${exportNames.join(',\n  ')},\n})`);
