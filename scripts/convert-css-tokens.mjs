/**
 * CSS-to-JSON Token Converter
 *
 * Reads reference.css and semantic.css from the chzzk design-system,
 * then generates DTCG-standard JSON token files under packages/foundation/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, '../chzzk/design-system/src/tokens');
const OUT = resolve(ROOT, 'packages/foundation');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a CSS variable name to a dot-separated token path.
 *  e.g. "--ref-color-neutral-0" -> "ref.color.neutral.0"
 */
function varNameToPath(name) {
  // strip leading "--"
  return name.replace(/^--/, '').replace(/-/g, '.');
}

/** Convert a CSS value that may contain var() or calc(var()) to a token value string. */
function convertValue(raw) {
  raw = raw.trim().replace(/;$/, '').trim();

  // calc(var(--ref-*) * 1px) -> extract the var reference
  const calcMatch = raw.match(/^calc\(\s*var\(\s*--([^)]+)\s*\)\s*\*\s*1px\s*\)$/);
  if (calcMatch) {
    return `{${varNameToPath(calcMatch[1])}}`;
  }

  // var(--something)  (may reference --ref-* or --sem-*)
  const varMatch = raw.match(/^var\(\s*--([^)]+)\s*\)$/);
  if (varMatch) {
    return `{${varNameToPath(varMatch[1])}}`;
  }

  // Strip trailing "px" from plain numeric+px values (e.g. "2px" -> "2")
  const pxMatch = raw.match(/^(-?[\d.]+)px$/);
  if (pxMatch) {
    return pxMatch[1];
  }

  // Plain value (hex, number, string)
  return raw;
}

/** Infer the $type for a token based on its dot-path. */
function inferType(path) {
  if (path.includes('.color.'))      return 'color';
  if (path.includes('.font.family')) return 'fontFamily';
  if (path.includes('.font.style'))  return 'fontFamily';
  if (path.includes('.font.size'))   return 'dimension';
  if (path.includes('.font.weight')) return 'fontWeight';
  if (path.includes('.line.height')) return 'dimension';
  if (path.includes('.letter.spacing')) return 'dimension';
  if (path.includes('.spacing.'))    return 'dimension';
  if (path.includes('.radius'))      return 'dimension';
  if (path.includes('.stroke.width')) return 'dimension';
  if (path.includes('.elevation.'))  return 'dimension';
  if (path.includes('.opacity'))     return 'number';
  return 'dimension'; // fallback
}

/** Set a deeply nested key in an object, e.g. setNested(obj, "a.b.c", val) */
function setNested(obj, dotPath, val) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!(keys[i] in cur) || typeof cur[keys[i]] !== 'object' || cur[keys[i]] === null) {
      cur[keys[i]] = {};
    }
    cur = cur[keys[i]];
  }
  const lastKey = keys[keys.length - 1];
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    // merge into existing object if present
    if (typeof cur[lastKey] === 'object' && cur[lastKey] !== null) {
      Object.assign(cur[lastKey], val);
    } else {
      cur[lastKey] = val;
    }
  } else {
    cur[lastKey] = val;
  }
}

/** Get a deeply nested value from an object by dot-path. */
function getNested(obj, dotPath) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

/** Write JSON to a file, creating directories as needed. */
function writeJSON(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`  wrote ${filePath}`);
}

// ---------------------------------------------------------------------------
// CSS Parsing
// ---------------------------------------------------------------------------

/**
 * Parse all CSS blocks from a file, returning an array of:
 *   { selector: string, declarations: Array<{ prop: string, value: string }> }
 *
 * Handles nested selectors inside @media blocks by flattening them.
 */
function parseCSSBlocks(css) {
  const blocks = [];
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Simple state-machine parser for { } blocks
  let i = 0;
  const len = css.length;

  function skipWhitespace() {
    while (i < len && /\s/.test(css[i])) i++;
  }

  function readUntil(ch) {
    let start = i;
    while (i < len && css[i] !== ch) i++;
    return css.slice(start, i);
  }

  while (i < len) {
    skipWhitespace();
    if (i >= len) break;

    // Read selector (everything before '{')
    const selectorStart = i;
    let braceDepth = 0;
    // find the next opening brace at depth 0
    while (i < len && css[i] !== '{') i++;
    if (i >= len) break;

    let selector = css.slice(selectorStart, i).trim();
    i++; // skip '{'

    // Check if this is an @media block
    if (selector.startsWith('@media')) {
      // We need to parse inner blocks
      // Find matching closing brace
      let innerStart = i;
      braceDepth = 1;
      while (i < len && braceDepth > 0) {
        if (css[i] === '{') braceDepth++;
        else if (css[i] === '}') braceDepth--;
        i++;
      }
      let innerCSS = css.slice(innerStart, i - 1);
      // Recursively parse inner blocks
      let innerBlocks = parseCSSBlocks(innerCSS);
      // Tag them with the @media selector for context, but we mainly care about
      // the inner selectors. For our purposes, treat them the same as top-level.
      for (const b of innerBlocks) {
        blocks.push(b);
      }
      continue;
    }

    // Read declarations until matching '}'
    let bodyStart = i;
    braceDepth = 1;
    while (i < len && braceDepth > 0) {
      if (css[i] === '{') braceDepth++;
      else if (css[i] === '}') braceDepth--;
      i++;
    }
    let body = css.slice(bodyStart, i - 1);

    // Parse declarations
    const declarations = [];
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.includes(':')) continue;
      // Find first colon
      const colonIdx = trimmed.indexOf(':');
      const prop = trimmed.slice(0, colonIdx).trim();
      let value = trimmed.slice(colonIdx + 1).trim();
      // Strip trailing semicolon
      if (value.endsWith(';')) value = value.slice(0, -1).trim();
      if (prop.startsWith('--')) {
        declarations.push({ prop, value });
      }
    }

    if (declarations.length > 0) {
      blocks.push({ selector, declarations });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('Reading CSS files...');
const referenceCss = readFileSync(resolve(SRC, 'reference.css'), 'utf8');
const semanticCss  = readFileSync(resolve(SRC, 'semantic.css'), 'utf8');

// ---- Parse reference.css ----
console.log('Parsing reference.css...');
const refBlocks = parseCSSBlocks(referenceCss);

const refTokens = {}; // flat map: dotPath -> { $value, $type }

for (const block of refBlocks) {
  for (const { prop, value } of block.declarations) {
    const path = varNameToPath(prop);
    const converted = convertValue(value);
    const type = inferType(path);
    refTokens[path] = { $value: converted, $type: type };
  }
}

// ---- Parse semantic.css ----
console.log('Parsing semantic.css...');
const semBlocks = parseCSSBlocks(semanticCss);

// Separate dark (:root) and light ([data-theme="light"]) and en ([data-lang="en"])
const semDark  = {}; // dotPath -> value
const semLight = {}; // dotPath -> value
const semEn    = {}; // dotPath -> value

for (const block of semBlocks) {
  const sel = block.selector.trim();
  const isLight = sel.includes('data-theme="light"') || sel.includes("data-theme='light'");
  const isEn    = sel.includes('data-lang="en"') || sel.includes("data-lang='en'");
  // @media (prefers-color-scheme: light) inner blocks should also be treated as light
  const isMediaLight = sel.includes(':not([data-theme="dark"])') || sel.includes("prefers-color-scheme: light");

  for (const { prop, value } of block.declarations) {
    const path = varNameToPath(prop);
    const converted = convertValue(value);
    if (isLight || isMediaLight) {
      semLight[path] = converted;
    } else if (isEn) {
      semEn[path] = converted;
    } else {
      // :root (dark mode default)
      semDark[path] = converted;
    }
  }
}

// ---- Build output JSON structures ----

// -- Reference tokens --
console.log('Building reference token files...');

const refColor = {};
const refTypography = {};
const refSpacing = {};
const refRadius = {};
const refStrokeWidth = {}; // -> shadow.json

for (const [path, token] of Object.entries(refTokens)) {
  if (path.startsWith('ref.color.')) {
    setNested(refColor, path, token);
  } else if (path.startsWith('ref.typography.')) {
    setNested(refTypography, path, token);
  } else if (path.startsWith('ref.layout.spacing.')) {
    setNested(refSpacing, path, token);
  } else if (path.startsWith('ref.radius.')) {
    setNested(refRadius, path, token);
  } else if (path.startsWith('ref.stroke.width.')) {
    setNested(refStrokeWidth, path, token);
  }
}

// -- Semantic tokens --
console.log('Building semantic token files...');

const semColor = {};
const semTypography = {};
const semRadius = {};
const semShadow = {}; // elevation + stroke.width + opacity

// Collect all unique semantic paths from dark + light + en
const allSemPaths = new Set([
  ...Object.keys(semDark),
  ...Object.keys(semLight),
  ...Object.keys(semEn),
]);

for (const path of allSemPaths) {
  const darkVal  = semDark[path];
  const lightVal = semLight[path];
  const enVal    = semEn[path];

  const type = inferType(path);
  const token = {};

  if (darkVal !== undefined) {
    token.$value = darkVal;
  } else if (lightVal !== undefined) {
    // some tokens only exist in light (unlikely but handle)
    token.$value = lightVal;
  }
  token.$type = type;

  if (lightVal !== undefined && lightVal !== darkVal) {
    token.light = lightVal;
  }
  if (enVal !== undefined) {
    token.en = enVal;
  }

  // Route to the correct output file
  if (path.startsWith('sem.color.')) {
    setNested(semColor, path, token);
  } else if (path.startsWith('sem.typography.')) {
    setNested(semTypography, path, token);
  } else if (path.startsWith('sem.corner.radius.')) {
    setNested(semRadius, path, token);
  } else if (
    path.startsWith('sem.elevation.') ||
    path.startsWith('sem.stroke.width.') ||
    path.startsWith('sem.opacity.')
  ) {
    setNested(semShadow, path, token);
  }
}

// ---- Write output files ----
console.log('Writing JSON files...');

// Reference
writeJSON(resolve(OUT, 'reference/color.json'), refColor);
writeJSON(resolve(OUT, 'reference/typography.json'), refTypography);
writeJSON(resolve(OUT, 'reference/spacing.json'), refSpacing);
writeJSON(resolve(OUT, 'reference/radius.json'), refRadius);
writeJSON(resolve(OUT, 'reference/shadow.json'), refStrokeWidth);

// Semantic
writeJSON(resolve(OUT, 'semantic/color.json'), semColor);
writeJSON(resolve(OUT, 'semantic/typography.json'), semTypography);
writeJSON(resolve(OUT, 'semantic/spacing.json'), {}); // no sem.spacing tokens
writeJSON(resolve(OUT, 'semantic/radius.json'), semRadius);
writeJSON(resolve(OUT, 'semantic/shadow.json'), semShadow);

// ---- Verification ----
console.log('\n--- Verification ---');

function verify(label, obj, dotPath, expectedKey, expectedVal) {
  const node = getNested(obj, dotPath);
  if (!node) {
    console.log(`  FAIL: ${label} - path "${dotPath}" not found`);
    return;
  }
  const actual = node[expectedKey];
  if (actual === expectedVal) {
    console.log(`  OK:   ${label}`);
  } else {
    console.log(`  FAIL: ${label} - expected ${expectedKey}="${expectedVal}", got "${actual}"`);
  }
}

verify(
  'ref.color.neutral.0.$value',
  refColor, 'ref.color.neutral.0', '$value', '#ffffff'
);
verify(
  'sem.color.background.neutral.weak.$value (dark)',
  semColor, 'sem.color.background.neutral.weak', '$value', '{ref.color.neutral.95}'
);
verify(
  'sem.color.background.neutral.weak.light',
  semColor, 'sem.color.background.neutral.weak', 'light', '{ref.color.neutral.2}'
);

// Typography checks
const refTypoNode = getNested(refTypography, 'ref.typography.font.family.nemony');
console.log(`  ref.typography.font.family.nemony.$value = "${refTypoNode?.$value}"`);

const refFontSize10 = getNested(refTypography, 'ref.typography.font.size.10');
console.log(`  ref.typography.font.size.10.$value = "${refFontSize10?.$value}"`);

const refFontWeightBold = getNested(refTypography, 'ref.typography.font.weight.bold');
console.log(`  ref.typography.font.weight.bold.$value = "${refFontWeightBold?.$value}"`);

const refLineHeight12 = getNested(refTypography, 'ref.typography.line.height.12');
console.log(`  ref.typography.line.height.12.$value = "${refLineHeight12?.$value}"`);

const refLetterSpacing0 = getNested(refTypography, 'ref.typography.letter.spacing.0');
console.log(`  ref.typography.letter.spacing.0.$value = "${refLetterSpacing0?.$value}"`);

// Spacing
const refSpacing8 = getNested(refSpacing, 'ref.layout.spacing.8');
console.log(`  ref.layout.spacing.8.$value = "${refSpacing8?.$value}"`);

// Radius
const refRadius8 = getNested(refRadius, 'ref.radius.8');
console.log(`  ref.radius.8.$value = "${refRadius8?.$value}"`);

console.log('\nDone!');
