/**
 * Foundation JSON 토큰에서 CSS 변수 파일을 생성합니다.
 * 토큰 경로가 그대로 CSS 변수명이 됩니다.
 *
 * 예: sem.color.surface.neutral.weaker → --sem-color-surface-neutral-weaker
 *
 * 실행: node scripts/generate-css-variables.mjs
 * 출력: packages/storybook/src/tokens.generated.css
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FOUNDATION = resolve(ROOT, 'packages/foundation');
const OUT = resolve(ROOT, 'packages/storybook/src/tokens.generated.css');

function loadJson(path) {
  return JSON.parse(readFileSync(resolve(FOUNDATION, path), 'utf-8'));
}

// 모든 JSON 로드
const refColor = loadJson('reference/color.json');
const refTypo = loadJson('reference/typography.json');
const refSpacing = loadJson('reference/spacing.json');
const refRadius = loadJson('reference/radius.json');
const refShadow = loadJson('reference/shadow.json');
const semColor = loadJson('semantic/color.json');
const semTypo = loadJson('semantic/typography.json');
const semSpacing = loadJson('semantic/spacing.json');
const semRadius = loadJson('semantic/radius.json');
const semShadow = loadJson('semantic/shadow.json');
const semTypoComposite = loadJson('semantic/typography-composite.json');

// ─── 토큰 경로 → CSS 변수명 변환 ──────────────────────

function pathToCssVar(path) {
  return '--' + path.replace(/\./g, '-');
}

// ─── Reference 값 resolve ─────────────────────────────

const allRefs = { ref: { color: refColor.ref?.color, typography: refTypo.ref?.typography, layout: refSpacing.ref?.layout, radius: refRadius.ref?.radius, stroke: refShadow.ref?.stroke } };

function resolveRef(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;
  const keys = match[1].split('.');
  let cur = allRefs;
  for (const key of keys) {
    if (!cur || !cur[key]) return value;
    cur = cur[key];
  }
  return cur.$value !== undefined ? cur.$value : value;
}

// ─── JSON → CSS 변수 추출 ─────────────────────────────

function extractVars(obj, prefix, vars, isRef = false) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && value.$value !== undefined) {
      const cssVar = pathToCssVar(path);
      const resolved = isRef ? value.$value : resolveRef(value.$value);

      // 숫자 값에 단위 추가
      let cssValue = resolved;
      if (value.$type === 'dimension' && typeof cssValue === 'number') {
        cssValue = `${cssValue}px`;
      } else if (value.$type === 'dimension' && typeof cssValue === 'string' && /^\d+(\.\d+)?$/.test(cssValue)) {
        cssValue = `${cssValue}px`;
      }

      vars.push({ var: cssVar, value: cssValue, path });

      // light 모드
      if (value.light) {
        const lightResolved = resolveRef(value.light);
        vars.push({ var: `${cssVar}-light`, value: lightResolved, path: `${path}.light`, isLight: true });
      }

      // en 모드
      if (value.en) {
        const enResolved = resolveRef(value.en);
        vars.push({ var: `${cssVar}-en`, value: enResolved, path: `${path}.en`, isEn: true });
      }
    } else if (value && typeof value === 'object' && !value.$value) {
      extractVars(value, path, vars, isRef);
    }
  }
}

// ─── 메인 ─────────────────────────────────────────────

const darkVars = [];
const lightVars = [];

// Reference 토큰
extractVars(refColor, '', darkVars, true);
extractVars(refTypo, '', darkVars, true);
extractVars(refSpacing, '', darkVars, true);
extractVars(refRadius, '', darkVars, true);
extractVars(refShadow, '', darkVars, true);

// Semantic 토큰
extractVars(semColor, '', darkVars);
extractVars(semTypo, '', darkVars);
extractVars(semSpacing, '', darkVars);
extractVars(semRadius, '', darkVars);
extractVars(semShadow, '', darkVars);

// ─── 합성 타이포그래피 토큰 → CSS 변수 ──────────────

const allSem = { sem: { typography: semTypo.sem?.typography, layout: semSpacing.sem?.layout, color: semColor.sem?.color, radius: semRadius.sem?.radius } };

function resolveDeep(value) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;
  const keys = match[1].split('.');
  // 시맨틱에서 먼저 찾기
  let cur = allSem;
  for (const key of keys) {
    if (!cur || !cur[key]) { cur = null; break; }
    cur = cur[key];
  }
  if (cur && cur.$value !== undefined) {
    return resolveDeep(cur.$value); // 재귀 resolve
  }
  // 레퍼런스에서 찾기
  cur = allRefs;
  for (const key of keys) {
    if (!cur || !cur[key]) return value;
    cur = cur[key];
  }
  return cur.$value !== undefined ? cur.$value : value;
}

function buildCompositeTypoVars() {
  const composites = semTypoComposite.sem.typography.composite;
  const vars = [];

  for (const [category, fonts] of Object.entries(composites)) {
    for (const [fontStyle, sizes] of Object.entries(fonts)) {
      for (const [size, weightOrToken] of Object.entries(sizes)) {
        if (weightOrToken.$type === 'typography') {
          // Nemony: 단일 weight
          const v = weightOrToken.$value;
          const prefix = `--sem-typography-${category}-${fontStyle}-${size}`;
          const resolved = {
            fontFamily: resolveDeep(v.fontFamily) + (fontStyle === 'pretendard' ? ', -apple-system, sans-serif' : ''),
            fontSize: resolveDeep(v.fontSize) + 'px',
            lineHeight: resolveDeep(v.lineHeight) + 'px',
            fontWeight: resolveDeep(v.fontWeight),
            letterSpacing: resolveDeep(v.letterSpacing) + 'px',
          };
          vars.push({ var: `${prefix}-font-family`, value: resolved.fontFamily });
          vars.push({ var: `${prefix}-font-size`, value: resolved.fontSize });
          vars.push({ var: `${prefix}-line-height`, value: resolved.lineHeight });
          vars.push({ var: `${prefix}-font-weight`, value: resolved.fontWeight });
          vars.push({ var: `${prefix}-letter-spacing`, value: resolved.letterSpacing });
        } else {
          for (const [weight, token] of Object.entries(weightOrToken)) {
            if (!token.$value) continue;
            const v = token.$value;
            const prefix = `--sem-typography-${category}-${fontStyle}-${size}-${weight}`;
            const resolved = {
              fontFamily: resolveDeep(v.fontFamily) + (fontStyle === 'pretendard' ? ', -apple-system, sans-serif' : ''),
              fontSize: resolveDeep(v.fontSize) + 'px',
              lineHeight: resolveDeep(v.lineHeight) + 'px',
              fontWeight: resolveDeep(v.fontWeight),
              letterSpacing: resolveDeep(v.letterSpacing) + 'px',
            };
            vars.push({ var: `${prefix}-font-family`, value: resolved.fontFamily });
            vars.push({ var: `${prefix}-font-size`, value: resolved.fontSize });
            vars.push({ var: `${prefix}-line-height`, value: resolved.lineHeight });
            vars.push({ var: `${prefix}-font-weight`, value: resolved.fontWeight });
            vars.push({ var: `${prefix}-letter-spacing`, value: resolved.letterSpacing });
          }
        }
      }
    }
  }
  return vars;
}

const compositeTypoVars = buildCompositeTypoVars();

// dark/light 분리
const rootVars = darkVars.filter(v => !v.isLight && !v.isEn);
const lightOnlyVars = darkVars.filter(v => v.isLight);

// CSS 생성
const lines = [
  '/**',
  ' * 자동 생성 파일 — 직접 수정하지 마세요.',
  ' * Foundation JSON 토큰에서 CSS 변수를 생성합니다.',
  ` * 생성 시각: ${new Date().toISOString()}`,
  ' * 실행: node scripts/generate-css-variables.mjs',
  ' */',
  '',
  ':root {',
  '  /* ── Reference Color ── */',
  ...rootVars
    .filter(v => v.path.startsWith('ref.color'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Reference Typography ── */',
  ...rootVars
    .filter(v => v.path.startsWith('ref.typography'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Reference Spacing ── */',
  ...rootVars
    .filter(v => v.path.startsWith('ref.layout'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Reference Radius ── */',
  ...rootVars
    .filter(v => v.path.startsWith('ref.radius'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Reference Shadow/Stroke ── */',
  ...rootVars
    .filter(v => v.path.startsWith('ref.stroke'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Semantic Color ── */',
  ...rootVars
    .filter(v => v.path.startsWith('sem.color'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Semantic Typography ── */',
  ...rootVars
    .filter(v => v.path.startsWith('sem.typography'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Semantic Spacing ── */',
  ...rootVars
    .filter(v => v.path.startsWith('sem.layout'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Semantic Radius ── */',
  ...rootVars
    .filter(v => v.path.startsWith('sem.radius'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Semantic Shadow/Elevation ── */',
  ...rootVars
    .filter(v => v.path.startsWith('sem.elevation') || v.path.startsWith('sem.stroke') || v.path.startsWith('sem.opacity'))
    .map(v => `  ${v.var}: ${v.value};`),
  '',
  '  /* ── Typography Composite ── */',
  ...compositeTypoVars.map(v => `  ${v.var}: ${v.value};`),
  '}',
  '',
  '/* ── Light mode overrides ── */',
  '[data-theme="light"] {',
  ...lightOnlyVars.map(v => `  ${v.var.replace('-light', '')}: ${v.value};`),
  '}',
  '',
];

writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`✓ ${OUT}`);
console.log(`  ${rootVars.length} dark variables, ${lightOnlyVars.length} light overrides`);
