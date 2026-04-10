# 치지직 디자인 시스템 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 CSS 토큰을 JSON SSOT로 변환하고, pnpm 모노레포 기반 Storybook으로 시각화하는 chzzk-design 프로젝트 구축

**Architecture:** pnpm 워크스페이스 모노레포. `packages/foundation`이 JSON 토큰 SSOT, `packages/storybook`이 시각화 담당. Node.js 변환 스크립트로 기존 CSS에서 DTCG 표준 JSON을 자동 생성.

**Tech Stack:** pnpm workspace, React 18, Vite 5, Storybook 8, Node.js (변환 스크립트)

---

## 파일 구조

```
chzzk-design/
├── package.json                              # 워크스페이스 루트
├── pnpm-workspace.yaml                       # 워크스페이스 선언
├── .gitignore
├── scripts/
│   └── convert-css-tokens.mjs                # CSS → JSON 변환 스크립트
├── packages/
│   ├── foundation/                           # @chzzk-ds/tokens
│   │   ├── package.json
│   │   ├── index.json                        # 메타데이터
│   │   ├── reference/
│   │   │   ├── color.json
│   │   │   ├── typography.json
│   │   │   ├── spacing.json
│   │   │   ├── radius.json
│   │   │   └── shadow.json
│   │   └── semantic/
│   │       ├── color.json
│   │       ├── typography.json
│   │       ├── spacing.json
│   │       ├── radius.json
│   │       └── shadow.json
│   └── storybook/                            # @chzzk-ds/storybook
│       ├── package.json
│       ├── vite.config.js
│       ├── .storybook/
│       │   ├── main.js
│       │   └── preview.js
│       └── src/
│           └── stories/
│               └── foundation/
│                   ├── ColorTokens.stories.jsx
│                   ├── ColorTokens.module.css
│                   ├── TypographyTokens.stories.jsx
│                   ├── TypographyTokens.module.css
│                   ├── SpacingTokens.stories.jsx
│                   └── SpacingTokens.module.css
└── docs/
```

---

### Task 1: 모노레포 스캐폴딩

**Files:**
- Create: `chzzk-design/package.json`
- Create: `chzzk-design/pnpm-workspace.yaml`
- Create: `chzzk-design/.gitignore`

- [ ] **Step 1: 루트 package.json 생성**

```json
{
  "name": "chzzk-design",
  "private": true,
  "scripts": {
    "storybook": "pnpm --filter @chzzk-ds/storybook storybook",
    "build": "pnpm --filter @chzzk-ds/storybook build",
    "convert": "node scripts/convert-css-tokens.mjs"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: pnpm-workspace.yaml 생성**

```yaml
packages:
  - 'packages/*'
```

- [ ] **Step 3: .gitignore 생성**

```
node_modules/
dist/
.DS_Store
*.log
```

- [ ] **Step 4: pnpm install 실행하여 워크스페이스 초기화 확인**

Run: `cd chzzk-design && pnpm install`
Expected: 빈 워크스페이스 초기화 성공, `pnpm-lock.yaml` 생성

- [ ] **Step 5: 커밋**

```bash
git add package.json pnpm-workspace.yaml .gitignore pnpm-lock.yaml
git commit -m "chore: init pnpm monorepo workspace"
```

---

### Task 2: Foundation 패키지 셋업

**Files:**
- Create: `packages/foundation/package.json`
- Create: `packages/foundation/index.json`

- [ ] **Step 1: foundation package.json 생성**

```json
{
  "name": "@chzzk-ds/tokens",
  "version": "0.0.1",
  "private": true,
  "description": "치지직 디자인 토큰 SSOT (DTCG 표준)",
  "main": "index.json",
  "files": [
    "index.json",
    "reference/",
    "semantic/"
  ]
}
```

- [ ] **Step 2: index.json 생성**

```json
{
  "$name": "Chzzk Design Tokens",
  "$version": "0.0.1",
  "$source": "Figma Variables API",
  "$defaultTheme": "dark",
  "collections": {
    "reference": [
      "reference/color.json",
      "reference/typography.json",
      "reference/spacing.json",
      "reference/radius.json",
      "reference/shadow.json"
    ],
    "semantic": [
      "semantic/color.json",
      "semantic/typography.json",
      "semantic/spacing.json",
      "semantic/radius.json",
      "semantic/shadow.json"
    ]
  }
}
```

- [ ] **Step 3: reference/ 및 semantic/ 디렉토리 생성**

```bash
mkdir -p packages/foundation/reference packages/foundation/semantic
```

- [ ] **Step 4: 커밋**

```bash
git add packages/foundation/
git commit -m "chore: add foundation package skeleton"
```

---

### Task 3: CSS → JSON 변환 스크립트 작성

기존 `chzzk/design-system/src/tokens/reference.css` (456줄)와 `semantic.css` (1472줄)를 파싱하여 DTCG 표준 JSON으로 변환하는 Node.js 스크립트.

**Files:**
- Create: `scripts/convert-css-tokens.mjs`

- [ ] **Step 1: 변환 스크립트 작성**

`scripts/convert-css-tokens.mjs` — CSS 커스텀 프로퍼티를 파싱하여 JSON 토큰 파일을 생성한다.

스크립트 동작:
1. `reference.css`에서 `:root` 블록의 `--ref-*` 변수를 파싱
2. 변수명을 `.` 구분 JSON 경로로 변환 (예: `--ref-color-neutral-0` → `ref.color.neutral.0`)
3. 카테고리별로 분류: color, typography(font-family/font-size/font-weight/line-height/letter-spacing), layout(spacing), radius, stroke-width(shadow 파일에 포함)
4. `semantic.css`에서 `:root` 블록(다크모드 기본)과 `[data-theme="light"]` 블록(라이트모드)을 각각 파싱
5. Semantic 토큰의 `var(--ref-*)` 참조를 `"{ref.*}"` 문자열 참조로 변환
6. 다크/라이트 값을 하나의 토큰 객체로 병합 (`$value` + `light`)
7. 카테고리별 JSON 파일 출력

```javascript
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSS_DIR = resolve(ROOT, '../chzzk/design-system/src/tokens');
const OUT_DIR = resolve(ROOT, 'packages/foundation');

// ─── CSS 파싱 ────────────────────────────────────────────

function parseCssBlock(css, selector) {
  const blocks = [];
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedSelector + '\\s*\\{([^}]+)\\}', 'g');
  let match;
  while ((match = regex.exec(css)) !== null) {
    const vars = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const m = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*;/);
      if (m) vars[m[1]] = m[2];
    }
    blocks.push(vars);
  }
  // 여러 블록을 하나로 병합 (같은 셀렉터가 여러 번 나올 수 있음)
  return Object.assign({}, ...blocks);
}

// ─── 변수명 → 중첩 객체 경로 변환 ─────────────────────────

function setNested(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]]) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function varNameToPath(name) {
  // --ref-color-neutral-0 → ref.color.neutral.0
  return name.replace(/^--/, '').replace(/-/g, '.');
}

// ─── var(--ref-*) → "{ref.*}" 참조 변환 ──────────────────

function convertVarRef(value) {
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (m) {
    return '{' + varNameToPath(m[1]) + '}';
  }
  return value;
}

// ─── Reference 토큰 분류 ─────────────────────────────────

const REF_CATEGORIES = {
  color: (path) => path.startsWith('ref.color.'),
  typography: (path) =>
    path.startsWith('ref.typography.'),
  spacing: (path) => path.startsWith('ref.layout.spacing.'),
  radius: (path) => path.startsWith('ref.radius.'),
  shadow: (path) => path.startsWith('ref.stroke.width.'),
};

// ─── Semantic 토큰 분류 ──────────────────────────────────

const SEM_CATEGORIES = {
  color: (path) => path.startsWith('sem.color.'),
  typography: (path) => path.startsWith('sem.typography.'),
  spacing: (path) => path.startsWith('sem.spacing.'),
  radius: (path) => path.startsWith('sem.corner.radius.'),
  shadow: (path) =>
    path.startsWith('sem.elevation.') ||
    path.startsWith('sem.stroke.width.') ||
    path.startsWith('sem.opacity.'),
};

// ─── $type 추론 ──────────────────────────────────────────

function inferType(path, value) {
  if (path.includes('.color.')) return 'color';
  if (path.includes('.font.family') || path.includes('.font.style')) return 'fontFamily';
  if (path.includes('.font.size')) return 'dimension';
  if (path.includes('.font.weight')) return 'fontWeight';
  if (path.includes('.line.height')) return 'dimension';
  if (path.includes('.letter.spacing')) return 'dimension';
  if (path.includes('.spacing.')) return 'dimension';
  if (path.includes('.radius')) return 'dimension';
  if (path.includes('.stroke.width')) return 'dimension';
  if (path.includes('.elevation.')) return 'dimension';
  if (path.includes('.opacity')) return 'number';
  return 'other';
}

// ─── 메인 ────────────────────────────────────────────────

function main() {
  const refCss = readFileSync(resolve(CSS_DIR, 'reference.css'), 'utf-8');
  const semCss = readFileSync(resolve(CSS_DIR, 'semantic.css'), 'utf-8');

  // Reference 파싱
  const refVars = parseCssBlock(refCss, ':root');
  const refTokens = {};
  for (const [name, value] of Object.entries(refVars)) {
    const path = varNameToPath(name);
    const type = inferType(path, value);
    setNested(refTokens, path, { $value: value, $type: type });
  }

  // Semantic 파싱 — 다크(기본)
  const semDarkVars = parseCssBlock(semCss, ':root');
  const semTokens = {};
  for (const [name, value] of Object.entries(semDarkVars)) {
    const path = varNameToPath(name);
    const type = inferType(path, value);
    const resolved = convertVarRef(value);
    setNested(semTokens, path, { $value: resolved, $type: type });
  }

  // Semantic 파싱 — 라이트
  const semLightVars = parseCssBlock(semCss, '[data-theme="light"]');
  for (const [name, value] of Object.entries(semLightVars)) {
    const path = varNameToPath(name);
    const resolved = convertVarRef(value);
    // 기존 토큰에 light 필드 추가
    const keys = path.split('.');
    let cur = semTokens;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    const leaf = keys[keys.length - 1];
    if (cur[leaf] && cur[leaf].$value) {
      cur[leaf].light = resolved;
    } else {
      // 라이트에만 존재하는 토큰
      const type = inferType(path, value);
      setNested(semTokens, path, { $value: resolved, $type: type, light: resolved });
    }
  }

  // EN 모드 파싱
  const semEnVars = parseCssBlock(semCss, '[data-lang="en"]');
  for (const [name, value] of Object.entries(semEnVars)) {
    const path = varNameToPath(name);
    const resolved = convertVarRef(value);
    const keys = path.split('.');
    let cur = semTokens;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!cur[keys[i]]) cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    const leaf = keys[keys.length - 1];
    if (cur[leaf] && cur[leaf].$value) {
      cur[leaf].en = resolved;
    }
  }

  // Reference 카테고리별 출력
  for (const [category, matcher] of Object.entries(REF_CATEGORIES)) {
    const filtered = {};
    extractMatching(refTokens, '', matcher, filtered);
    const outPath = resolve(OUT_DIR, `reference/${category}.json`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(filtered, null, 2) + '\n');
    console.log(`✓ ${outPath}`);
  }

  // Semantic 카테고리별 출력
  for (const [category, matcher] of Object.entries(SEM_CATEGORIES)) {
    const filtered = {};
    extractMatching(semTokens, '', matcher, filtered);
    const outPath = resolve(OUT_DIR, `semantic/${category}.json`);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(filtered, null, 2) + '\n');
    console.log(`✓ ${outPath}`);
  }

  console.log('\n변환 완료!');
}

function extractMatching(obj, prefix, matcher, result) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !value.$value) {
      extractMatching(value, path, matcher, result);
    } else if (matcher(path)) {
      setNested(result, path, value);
    }
  }
}

main();
```

- [ ] **Step 2: 변환 스크립트 실행**

Run: `cd chzzk-design && node scripts/convert-css-tokens.mjs`
Expected: `packages/foundation/reference/` 와 `packages/foundation/semantic/` 아래에 JSON 파일 10개 생성

- [ ] **Step 3: 생성된 JSON 파일 검증**

각 파일을 열어 다음 항목을 확인:
- `reference/color.json`: `ref.color.neutral.0.$value`가 `"#ffffff"`인지
- `semantic/color.json`: `sem.color.background.neutral.weak.$value`가 `"{ref.color.neutral.95}"`이고 `light`가 `"{ref.color.neutral.2}"`인지
- `reference/typography.json`: `ref.typography.font.family.pretendard.$value`가 `"Pretendard"`인지
- `reference/spacing.json`: `ref.layout.spacing` 키가 존재하는지
- `reference/radius.json`: `ref.radius.0` ~ `ref.radius.9999` 키가 존재하는지

- [ ] **Step 4: 커밋**

```bash
git add scripts/ packages/foundation/reference/ packages/foundation/semantic/
git commit -m "feat: add CSS-to-JSON converter and generate foundation tokens"
```

---

### Task 4: Storybook 패키지 셋업

**Files:**
- Create: `packages/storybook/package.json`
- Create: `packages/storybook/vite.config.js`
- Create: `packages/storybook/.storybook/main.js`
- Create: `packages/storybook/.storybook/preview.js`

- [ ] **Step 1: storybook package.json 생성**

```json
{
  "name": "@chzzk-ds/storybook",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build": "storybook build"
  },
  "dependencies": {
    "@chzzk-ds/tokens": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@storybook/addon-essentials": "^8.4.0",
    "@storybook/react": "^8.4.0",
    "@storybook/react-vite": "^8.4.0",
    "storybook": "^8.4.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

- [ ] **Step 2: vite.config.js 생성**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 3: .storybook/main.js 생성**

```javascript
/** @type {import('@storybook/react-vite').StorybookConfig} */
const config = {
  stories: ['../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

- [ ] **Step 4: .storybook/preview.js 생성**

다크/라이트 테마 토글 데코레이터. Storybook 툴바에서 테마를 전환할 수 있게 한다.

```javascript
/** @type {import('@storybook/react').Preview} */
const preview = {
  globalTypes: {
    theme: {
      description: '테마 전환',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark (기본)' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      return (
        <div
          data-theme={theme === 'light' ? 'light' : undefined}
          style={{
            padding: '1rem',
            background: theme === 'dark' ? '#141517' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            minHeight: '100vh',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
```

- [ ] **Step 5: 의존성 설치**

Run: `cd chzzk-design && pnpm install`
Expected: 모든 패키지 의존성 설치 성공, `@chzzk-ds/tokens`이 워크스페이스 링크로 연결

- [ ] **Step 6: Storybook 실행 테스트**

Run: `cd chzzk-design && pnpm storybook`
Expected: Storybook이 포트 6006에서 실행되며 빈 상태로 열림 (아직 Story 없음)

- [ ] **Step 7: 커밋**

```bash
git add packages/storybook/
git commit -m "chore: add storybook package with dark/light theme toggle"
```

---

### Task 5: Color Tokens Story

**Files:**
- Create: `packages/storybook/src/stories/foundation/ColorTokens.stories.jsx`
- Create: `packages/storybook/src/stories/foundation/ColorTokens.module.css`

- [ ] **Step 1: ColorTokens.module.css 생성**

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.swatch {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.color {
  height: 64px;
}

.info {
  padding: 8px;
  font-size: 11px;
  font-family: monospace;
}

.name {
  font-weight: 600;
  word-break: break-all;
  margin-bottom: 4px;
}

.value {
  opacity: 0.6;
}

.section {
  margin-bottom: 32px;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: ColorTokens.stories.jsx 생성**

```jsx
import refColors from '@chzzk-ds/tokens/reference/color.json';
import semColors from '@chzzk-ds/tokens/semantic/color.json';
import styles from './ColorTokens.module.css';

export default {
  title: 'Foundation/Color',
};

function flattenTokens(obj, prefix = '') {
  const result = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && value.$value) {
      result.push({ path, ...value });
    } else if (value && typeof value === 'object') {
      result.push(...flattenTokens(value, path));
    }
  }
  return result;
}

function resolveValue(value, refData) {
  if (typeof value !== 'string') return value;
  const match = value.match(/^\{(.+)\}$/);
  if (!match) return value;
  const path = match[1].split('.');
  let cur = refData;
  for (const key of path) {
    if (!cur[key]) return value;
    cur = cur[key];
  }
  return cur.$value || value;
}

function ColorGrid({ tokens, theme, refData }) {
  return (
    <div className={styles.grid}>
      {tokens.map((token) => {
        const raw = theme === 'light' && token.light ? token.light : token.$value;
        const resolved = refData ? resolveValue(raw, refData) : raw;
        return (
          <div key={token.path} className={styles.swatch}>
            <div className={styles.color} style={{ backgroundColor: resolved }} />
            <div className={styles.info}>
              <div className={styles.name}>{token.path.split('.').slice(-2).join('.')}</div>
              <div className={styles.value}>{resolved}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function groupBySecondLevel(tokens) {
  const groups = {};
  for (const token of tokens) {
    const parts = token.path.split('.');
    const group = parts.length >= 3 ? parts.slice(0, 3).join('.') : parts.slice(0, 2).join('.');
    if (!groups[group]) groups[group] = [];
    groups[group].push(token);
  }
  return groups;
}

export const Reference = {
  render: () => {
    const tokens = flattenTokens(refColors);
    const groups = groupBySecondLevel(tokens);
    return (
      <div>
        <h1>Reference Colors</h1>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className={styles.section}>
            <div className={styles.sectionTitle}>{group}</div>
            <ColorGrid tokens={items} theme="dark" />
          </div>
        ))}
      </div>
    );
  },
};

export const Semantic = {
  render: (_, { globals }) => {
    const theme = globals.theme || 'dark';
    const tokens = flattenTokens(semColors);
    const groups = groupBySecondLevel(tokens);
    return (
      <div>
        <h1>Semantic Colors ({theme})</h1>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className={styles.section}>
            <div className={styles.sectionTitle}>{group}</div>
            <ColorGrid tokens={items} theme={theme} refData={refColors} />
          </div>
        ))}
      </div>
    );
  },
};
```

- [ ] **Step 3: Storybook에서 확인**

Run: `pnpm storybook`
Expected:
- Foundation/Color 카테고리에 Reference, Semantic 2개 Story 표시
- Reference: 컬러 스워치 그리드에 neutral, white-alpha, black-alpha, brand 등 그룹별 표시
- Semantic: 툴바에서 다크/라이트 전환 시 컬러 값이 변경됨

- [ ] **Step 4: 커밋**

```bash
git add packages/storybook/src/stories/foundation/ColorTokens*
git commit -m "feat: add color tokens story with dark/light toggle"
```

---

### Task 6: Typography Tokens Story

**Files:**
- Create: `packages/storybook/src/stories/foundation/TypographyTokens.stories.jsx`
- Create: `packages/storybook/src/stories/foundation/TypographyTokens.module.css`

- [ ] **Step 1: TypographyTokens.module.css 생성**

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;
  font-size: 13px;
}

.table th,
.table td {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.table th {
  font-weight: 600;
  opacity: 0.6;
  font-size: 11px;
  text-transform: uppercase;
}

.preview {
  font-family: Pretendard, sans-serif;
}

.section {
  margin-bottom: 32px;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: TypographyTokens.stories.jsx 생성**

```jsx
import refTypo from '@chzzk-ds/tokens/reference/typography.json';
import semTypo from '@chzzk-ds/tokens/semantic/typography.json';
import styles from './TypographyTokens.module.css';

export default {
  title: 'Foundation/Typography',
};

function flattenTokens(obj, prefix = '') {
  const result = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && value.$value) {
      result.push({ path, ...value });
    } else if (value && typeof value === 'object') {
      result.push(...flattenTokens(value, path));
    }
  }
  return result;
}

function groupByCategory(tokens) {
  const groups = {};
  for (const token of tokens) {
    const parts = token.path.split('.');
    const category = parts.length >= 4 ? parts.slice(0, 4).join('.') : parts.slice(0, 3).join('.');
    if (!groups[category]) groups[category] = [];
    groups[category].push(token);
  }
  return groups;
}

export const Reference = {
  render: () => {
    const tokens = flattenTokens(refTypo);
    const groups = groupByCategory(tokens);
    return (
      <div>
        <h1>Reference Typography</h1>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className={styles.section}>
            <div className={styles.sectionTitle}>{group}</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                {items.map((token) => (
                  <tr key={token.path}>
                    <td>{token.path.split('.').slice(-1)[0]}</td>
                    <td>{token.$value}</td>
                    <td>
                      {token.$type === 'dimension' && (
                        <span
                          className={styles.preview}
                          style={{ fontSize: `${token.$value}px` }}
                        >
                          가나다 ABC 123
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  },
};

export const Semantic = {
  render: () => {
    const tokens = flattenTokens(semTypo);
    const groups = groupByCategory(tokens);
    return (
      <div>
        <h1>Semantic Typography</h1>
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className={styles.section}>
            <div className={styles.sectionTitle}>{group}</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Value</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {items.map((token) => (
                  <tr key={token.path}>
                    <td>{token.path.split('.').slice(-2).join('.')}</td>
                    <td>{token.$value}</td>
                    <td>{token.$type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  },
};
```

- [ ] **Step 3: Storybook에서 확인**

Run: `pnpm storybook`
Expected:
- Foundation/Typography에 Reference, Semantic 2개 Story
- Reference: font-size 토큰에 미리보기 텍스트 표시
- Semantic: label/body/title/display 카테고리별 그룹 표시

- [ ] **Step 4: 커밋**

```bash
git add packages/storybook/src/stories/foundation/TypographyTokens*
git commit -m "feat: add typography tokens story"
```

---

### Task 7: Spacing Tokens Story

**Files:**
- Create: `packages/storybook/src/stories/foundation/SpacingTokens.stories.jsx`
- Create: `packages/storybook/src/stories/foundation/SpacingTokens.module.css`

- [ ] **Step 1: SpacingTokens.module.css 생성**

```css
.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.label {
  font-family: monospace;
  font-size: 13px;
  min-width: 200px;
}

.bar {
  height: 24px;
  border-radius: 4px;
  transition: width 0.2s;
}

.value {
  font-family: monospace;
  font-size: 12px;
  opacity: 0.6;
  min-width: 50px;
}

.section {
  margin-bottom: 32px;
}

.sectionTitle {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
```

- [ ] **Step 2: SpacingTokens.stories.jsx 생성**

```jsx
import refSpacing from '@chzzk-ds/tokens/reference/spacing.json';
import refRadius from '@chzzk-ds/tokens/reference/radius.json';
import styles from './SpacingTokens.module.css';

export default {
  title: 'Foundation/Spacing',
};

function flattenTokens(obj, prefix = '') {
  const result = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && value.$value) {
      result.push({ path, ...value });
    } else if (value && typeof value === 'object') {
      result.push(...flattenTokens(value, path));
    }
  }
  return result;
}

function BarChart({ tokens, color }) {
  return (
    <div className={styles.list}>
      {tokens.map((token) => {
        const numValue = parseFloat(token.$value);
        return (
          <div key={token.path} className={styles.row}>
            <span className={styles.label}>{token.path.split('.').slice(-1)[0]}</span>
            <span className={styles.value}>{token.$value}px</span>
            <div
              className={styles.bar}
              style={{
                width: `${Math.max(numValue * 4, 2)}px`,
                backgroundColor: color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

export const Spacing = {
  render: () => {
    const tokens = flattenTokens(refSpacing);
    return (
      <div>
        <h1>Spacing Scale</h1>
        <BarChart tokens={tokens} color="#00ffa3" />
      </div>
    );
  },
};

export const Radius = {
  render: () => {
    const tokens = flattenTokens(refRadius);
    return (
      <div>
        <h1>Border Radius Scale</h1>
        <div className={styles.list}>
          {tokens.map((token) => (
            <div key={token.path} className={styles.row}>
              <span className={styles.label}>{token.path.split('.').slice(-1)[0]}</span>
              <span className={styles.value}>{token.$value}px</span>
              <div
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: '#00ffa3',
                  borderRadius: `${token.$value}px`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  },
};
```

- [ ] **Step 3: Storybook에서 확인**

Run: `pnpm storybook`
Expected:
- Foundation/Spacing에 Spacing, Radius 2개 Story
- Spacing: 바 차트로 0~36px 스케일 시각화
- Radius: 사각형에 각 radius 적용된 미리보기

- [ ] **Step 4: 커밋**

```bash
git add packages/storybook/src/stories/foundation/SpacingTokens*
git commit -m "feat: add spacing and radius tokens story"
```

---

### Task 8: Git 초기화 및 최종 확인

**Files:**
- Modify: `chzzk-design/` (Git repo 초기화)

- [ ] **Step 1: Git 저장소 초기화**

```bash
cd chzzk-design && git init
```

- [ ] **Step 2: 전체 Storybook 실행 확인**

Run: `pnpm storybook`
Expected:
- 6006 포트에서 Storybook 실행
- 사이드바에 Foundation/Color, Foundation/Typography, Foundation/Spacing 3개 카테고리
- 다크/라이트 테마 토글 정상 동작

- [ ] **Step 3: 전체 파일 최초 커밋**

```bash
git add .
git commit -m "feat: init chzzk-design monorepo with foundation tokens and storybook"
```
