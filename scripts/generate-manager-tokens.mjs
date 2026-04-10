/**
 * Foundation JSON 토큰을 읽어서 Storybook manager.js에서
 * import할 수 있는 JS 상수 파일을 생성합니다.
 *
 * 실행: node scripts/generate-manager-tokens.mjs
 * 출력: packages/storybook/.storybook/tokens.generated.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const FOUNDATION = resolve(ROOT, 'packages/foundation');
const OUT = resolve(ROOT, 'packages/storybook/.storybook/tokens.generated.js');

// ─── JSON 로드 ──────────────────────────────────────────

function loadJson(path) {
  return JSON.parse(readFileSync(resolve(FOUNDATION, path), 'utf-8'));
}

const refTypo = loadJson('reference/typography.json');
const refColor = loadJson('reference/color.json');
const refSpacing = loadJson('reference/spacing.json');
const refRadius = loadJson('reference/radius.json');
const semTypo = loadJson('semantic/typography.json');
const semSpacing = loadJson('semantic/spacing.json');
const semColor = loadJson('semantic/color.json');
const semTypoComposite = loadJson('semantic/typography-composite.json');
const indexJson = loadJson('index.json');

// ─── Reference 값 resolve ───────────────────────────────

function getRefValue(refData, path) {
  const keys = path.replace(/^\{/, '').replace(/\}$/, '').split('.');
  let cur = refData;
  for (const key of keys) {
    if (!cur || !cur[key]) return null;
    cur = cur[key];
  }
  return cur.$value !== undefined ? cur.$value : null;
}

function resolveValue(value, ...refSources) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;
  for (const ref of refSources) {
    const resolved = getRefValue(ref, value);
    if (resolved !== null) return resolved;
  }
  return value;
}

// ─── 토큰 추출 ──────────────────────────────────────────

// Typography semantic 토큰 → 실제 px 값으로 resolve
function buildTypographyTokens() {
  const sem = semTypo.sem.typography;
  const tokens = {};

  // font-style (font-family)
  const fontDefault = resolveValue(sem.font.style.default.$value, refTypo);
  tokens.fontFamily = fontDefault;

  // font-size: label, body, title, display
  for (const category of ['label', 'body', 'title', 'display']) {
    const sizes = sem.font.size[category];
    if (!sizes) continue;
    for (const [size, token] of Object.entries(sizes)) {
      const val = resolveValue(token.$value, refTypo);
      tokens[`fontSize_${category}_${size}`] = `${val}px`;
    }
  }

  // line-height: label, body, title, display
  for (const category of ['label', 'body', 'title', 'display']) {
    const heights = sem.line.height[category];
    if (!heights) continue;
    for (const [size, token] of Object.entries(heights)) {
      const val = resolveValue(token.$value, refTypo);
      tokens[`lineHeight_${category}_${size}`] = `${val}px`;
    }
  }

  // font-weight
  for (const [weight, token] of Object.entries(sem.font.weight)) {
    const val = resolveValue(token.$value, refTypo);
    tokens[`fontWeight_${weight}`] = val;
  }

  // letter-spacing
  for (const [name, token] of Object.entries(sem.letter.spacing)) {
    const val = resolveValue(token.$value, refTypo);
    tokens[`letterSpacing_${name}`] = `${val}px`;
  }

  return tokens;
}

// Spacing semantic 토큰
function buildSpacingTokens() {
  const sem = semSpacing.sem.layout.spacing;
  const tokens = {};
  for (const [name, token] of Object.entries(sem)) {
    const val = resolveValue(token.$value, refSpacing);
    tokens[`spacing_${name.replace(/-/g, '_')}`] = `${val}px`;
  }
  return tokens;
}

// Color semantic 토큰 → hex 값으로 resolve
function buildColorTokens() {
  const tokens = {};

  function resolveColorRef(value) {
    return resolveValue(value, refColor);
  }

  function getNestedValue(obj, path) {
    const keys = path.split('.');
    let cur = obj;
    for (const key of keys) {
      if (!cur || !cur[key]) return null;
      cur = cur[key];
    }
    return cur;
  }

  // Storybook 테마에 매핑할 시맨틱 컬러 토큰 정의
  // [export명, JSON 경로, 다크/라이트]
  const colorMap = [
    // 배경
    ['color_background_neutral_weak', 'sem.color.background.neutral.weak'],
    ['color_background_neutral_base', 'sem.color.background.neutral.base'],
    // 서피스
    ['color_surface_neutral_weakest', 'sem.color.surface.neutral.weakest'],
    ['color_surface_neutral_weaker', 'sem.color.surface.neutral.weaker'],
    ['color_surface_neutral_weak', 'sem.color.surface.neutral.weak'],
    ['color_surface_neutral_subtle', 'sem.color.surface.neutral.subtle'],
    ['color_surface_neutral_base', 'sem.color.surface.neutral.base'],
    ['color_surface_neutral_strong', 'sem.color.surface.neutral.strong'],
    ['color_surface_neutral_stronger', 'sem.color.surface.neutral.stronger'],
    ['color_surface_neutral_strongest', 'sem.color.surface.neutral.strongest'],
    ['color_surface_brand_weakest', 'sem.color.surface.brand.weakest'],
    ['color_surface_brand_strongest', 'sem.color.surface.brand.strongest'],
    // 콘텐츠 (텍스트)
    ['color_content_neutral_primary', 'sem.color.content.neutral.primary'],
    ['color_content_neutral_secondary', 'sem.color.content.neutral.secondary'],
    ['color_content_neutral_tertiary', 'sem.color.content.neutral.tertiary'],
    ['color_content_neutral_inverse', 'sem.color.content.neutral.inverse'],
    ['color_content_neutral_alpha_strong', 'sem.color.content.neutral.alpha.strong'],
    ['color_content_brand_weaker', 'sem.color.content.brand.weaker'],
    ['color_content_brand_base', 'sem.color.content.brand.base'],
    ['color_content_brand_strong', 'sem.color.content.brand.strong'],
    // 보더
    // 인터랙션
    ['color_surface_interaction_lighten_normal', 'sem.color.surface.interaction.lighten.normal'],
    ['color_surface_interaction_lighten_hovered', 'sem.color.surface.interaction.lighten.hovered'],
    ['color_surface_interaction_lighten_selected', 'sem.color.surface.interaction.lighten.selected'],
    // 보더
    ['color_border_neutral_weakest', 'sem.color.border.neutral.weakest'],
    ['color_border_neutral_weaker', 'sem.color.border.neutral.weaker'],
    ['color_border_neutral_weak', 'sem.color.border.neutral.weak'],
    ['color_border_neutral_base', 'sem.color.border.neutral.base'],
    ['color_border_neutral_alpha_base', 'sem.color.border.neutral.alpha.base'],
    ['color_border_brand_base', 'sem.color.border.brand.base'],
  ];

  for (const [exportName, jsonPath] of colorMap) {
    const node = getNestedValue(semColor, jsonPath);
    if (!node || !node.$value) continue;

    const darkVal = resolveColorRef(node.$value);
    const lightVal = node.light ? resolveColorRef(node.light) : darkVal;

    tokens[exportName] = darkVal;
    tokens[`${exportName}_light`] = lightVal;
  }

  return tokens;
}

// Typography 합성 토큰 → resolve된 CSS 속성 세트
function buildCompositeTypographyTokens() {
  const composites = semTypoComposite.sem.typography.composite;
  const tokens = {};

  // 시맨틱 참조를 최종 값으로 resolve
  function resolveTypoRef(ref) {
    // {sem.typography.font.size.label.13} → 시맨틱 → 레퍼런스 → 최종값
    const semVal = resolveValue(ref, semTypo);
    if (semVal !== ref) {
      // 시맨틱에서 resolve됨 → 레퍼런스로 한번 더
      return resolveValue(semVal, refTypo);
    }
    return resolveValue(ref, refTypo);
  }

  for (const [category, fonts] of Object.entries(composites)) {
    for (const [fontStyle, sizes] of Object.entries(fonts)) {
      for (const [size, weightOrToken] of Object.entries(sizes)) {
        if (weightOrToken.$type === 'typography') {
          // Nemony: 단일 weight
          const v = weightOrToken.$value;
          const name = `sem_typography_${category}_${fontStyle}_${size}`;
          tokens[name] = {
            fontFamily: resolveTypoRef(v.fontFamily) + (fontStyle === 'pretendard' ? ', -apple-system, sans-serif' : ''),
            fontSize: resolveTypoRef(v.fontSize) + 'px',
            lineHeight: resolveTypoRef(v.lineHeight) + 'px',
            fontWeight: resolveTypoRef(v.fontWeight),
            letterSpacing: resolveTypoRef(v.letterSpacing) + 'px',
          };
        } else {
          // Pretendard: multiple weights
          for (const [weight, token] of Object.entries(weightOrToken)) {
            if (!token.$value) continue;
            const v = token.$value;
            const name = `sem_typography_${category}_${fontStyle}_${size}_${weight}`;
            tokens[name] = {
              fontFamily: resolveTypoRef(v.fontFamily) + (fontStyle === 'pretendard' ? ', -apple-system, sans-serif' : ''),
              fontSize: resolveTypoRef(v.fontSize) + 'px',
              lineHeight: resolveTypoRef(v.lineHeight) + 'px',
              fontWeight: resolveTypoRef(v.fontWeight),
              letterSpacing: resolveTypoRef(v.letterSpacing) + 'px',
            };
          }
        }
      }
    }
  }
  return tokens;
}

// ─── JS 파일 생성 ────────────────────────────────────────

const typoTokens = buildTypographyTokens();
const spacingTokens = buildSpacingTokens();
const colorTokens = buildColorTokens();
const compositeTokens = buildCompositeTypographyTokens();

const lines = [
  '/**',
  ' * 자동 생성 파일 — 직접 수정하지 마세요.',
  ' * Foundation JSON 토큰에서 생성됩니다.',
  ` * 생성 시각: ${new Date().toISOString()}`,
  ' * 실행: node scripts/generate-manager-tokens.mjs',
  ' */',
  '',
  `export const VERSION = '${indexJson.$version}';`,
  '',
  '// Typography',
  `export const fontFamily = '${typoTokens.fontFamily}, -apple-system, sans-serif';`,
  '',
  '// Font Size',
  ...Object.entries(typoTokens)
    .filter(([k]) => k.startsWith('fontSize_'))
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Line Height',
  ...Object.entries(typoTokens)
    .filter(([k]) => k.startsWith('lineHeight_'))
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Font Weight',
  ...Object.entries(typoTokens)
    .filter(([k]) => k.startsWith('fontWeight_'))
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Letter Spacing',
  ...Object.entries(typoTokens)
    .filter(([k]) => k.startsWith('letterSpacing_'))
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Spacing',
  ...Object.entries(spacingTokens)
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Color (dark)',
  ...Object.entries(colorTokens)
    .filter(([k]) => !k.endsWith('_light'))
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Color (light)',
  ...Object.entries(colorTokens)
    .filter(([k]) => k.endsWith('_light'))
    .map(([k, v]) => `export const ${k} = '${v}';`),
  '',
  '// Typography Composite (세트 단위)',
  '// 사용법: import { sem_typography_label_pretendard_13_400 } from "./tokens.generated.js"',
  '// sem_typography_label_pretendard_13_400.fontSize → "13px"',
  ...Object.entries(compositeTokens)
    .map(([k, v]) => `export const ${k} = ${JSON.stringify(v)};`),
  '',
];

writeFileSync(OUT, lines.join('\n') + '\n');
console.log(`✓ ${OUT}`);
