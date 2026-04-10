# 치지직 디자인 시스템 — Foundation + Storybook 스펙

## 개요

치지직 디자인 시스템의 단일 진실 공급원(SSOT)을 JSON 토큰으로 관리하고, Storybook으로 시각화하는 모노레포 프로젝트.

- **SSOT**: `packages/foundation/` — JSON 토큰 (DTCG 표준)
- **시각화**: `packages/storybook/` — React + Storybook
- **데이터 출처**: 기존 `chzzk/design-system/` CSS 토큰에서 변환 (Figma Variables API 기반)
- `chzzk/design-system/`과의 동적 연결 없음 — 독립 프로젝트

## 디렉토리 구조

```
chzzk-design/                        # 모노레포 루트
├── pnpm-workspace.yaml
├── package.json                     # 워크스페이스 루트
├── README.md
├── packages/
│   ├── foundation/                  # @chzzk-ds/tokens — SSOT
│   │   ├── package.json
│   │   ├── index.json               # 메타데이터, 버전
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
│   └── storybook/                   # @chzzk-ds/storybook — 시각화
│       ├── package.json             # React 18 + Vite 5 + Storybook 8
│       ├── vite.config.js
│       ├── .storybook/
│       │   ├── main.js
│       │   └── preview.js
│       └── src/
│           └── stories/
│               └── foundation/
│                   ├── ColorTokens.stories.jsx
│                   ├── TypographyTokens.stories.jsx
│                   └── SpacingTokens.stories.jsx
└── docs/
```

## 토큰 아키텍처

### 2레이어 구조

- **Reference** (원시): 원시 값 — hex 컬러, px 크기, 폰트명
- **Semantic** (의미 기반): Reference 토큰을 참조하는 역할별 별칭
- Reference 토큰은 UI에서 직접 사용하지 않음 — 반드시 Semantic을 통해서만 참조

### 토큰 포맷 (DTCG 표준)

**Reference 토큰 예시** (`reference/color.json`):

```json
{
  "ref": {
    "color": {
      "neutral": {
        "0": { "$value": "#ffffff", "$type": "color" },
        "95": { "$value": "#0e0f10", "$type": "color" }
      },
      "white-alpha": {
        "a5": { "$value": "#ffffff0d", "$type": "color" }
      }
    }
  }
}
```

**Semantic 토큰 예시** (`semantic/color.json`):

```json
{
  "sem": {
    "color": {
      "surface": {
        "neutral": {
          "weak": {
            "$value": "{ref.color.neutral.60}",
            "$type": "color",
            "light": "{ref.color.neutral.3}"
          }
        }
      }
    }
  }
}
```

### 토큰 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `$value` | 예 | 기본값 (다크모드) |
| `$type` | 예 | 토큰 타입: color, dimension, typography, shadow 등 |
| `light` | Semantic만 | 라이트모드 오버라이드, Reference 토큰을 참조 |

### 테마 전략

- **다크모드가 기본** (`$value`) — 치지직은 다크 우선 제품
- **라이트모드**는 Semantic 토큰의 `light` 필드로 표현
- 기존 CSS 네이밍 유지: `ref.color.neutral.*`, `sem.color.surface.*` 등

### 참조 방식

문자열 경로 참조: `"{ref.color.neutral.60}"`
- 언어 무관 — Style Dictionary를 통해 멀티 플랫폼 변환 가능 (CSS, SCSS, Swift, Kotlin)
- DTCG 커뮤니티 그룹 사양 준수

## 토큰 카테고리

| 카테고리 | Reference | Semantic |
|----------|-----------|----------|
| Color | neutral, brand, alpha 팔레트 | surface, text, border, action, status |
| Typography | fontFamily, fontSize, fontWeight, lineHeight, letterSpacing | heading, body, label, caption (합성 토큰) |
| Spacing | 스케일 값 (4px 기반) | component, layout 용도별 |
| Radius | none ~ full 스케일 | button, input, card, modal |
| Shadow | 레벨 기반 원시 값 | card, dropdown, modal, toast |

## Storybook

### 기술 스택

- React 18
- Vite 5
- Storybook 8

### 동작 방식

- 각 Story는 `@chzzk-ds/tokens`에서 JSON을 직접 import (pnpm 워크스페이스 링크)
- `preview.js`에 다크/라이트 토글 데코레이터 — `$value`와 `light` 필드 전환
- 초기 스코프: **Color + Typography + Spacing** (3개 Story)
- Radius, Shadow Story는 토큰 데이터 확보 후 추가

## 모노레포 구성

- **pnpm 워크스페이스** — `packages/*`
- `@chzzk-ds/tokens` (foundation) — JSON 전용 패키지
- `@chzzk-ds/storybook` — `@chzzk-ds/tokens`에 의존
- 루트 `package.json`에서 공유 스크립트 관리

## 데이터 출처

모든 토큰 값은 Figma Variables API에서 자동 생성된 `chzzk/design-system/src/tokens/reference.css`와 `semantic.css`에서 변환. 기존 CSS 네이밍 규칙은 JSON 키에 그대로 보존.

## 현재 범위 밖 (추후 진행)

- `chzzk/design-system/`과의 동적 연결
- 컴포넌트 이관 (Button, Badge 등)
- Style Dictionary 빌드 파이프라인
- Changesets / 버전 관리 자동화
- CI/CD
