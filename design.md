# 피그마 → 코드 구현 워크플로우

## 디자인 시스템 레포 정보

- **레포**: https://oss.navercorp.com/chzzk-design/storybook.git
- **로컬 경로**: ~/Desktop/chzzk-storybook/
- **CDN 베이스**: https://cdn.jsdelivr.net/gh/chzzk-design/storybook@main/

### 리소스 경로
| 리소스 | 로컬 경로 | CDN 경로 |
|--------|-----------|---------|
| 토큰 CSS | `packages/storybook/src/tokens.generated.css` | `packages/storybook/src/tokens.generated.css` |
| 아이콘 SVG | `packages/icons/svg/icon-[name].svg` | `packages/icons/svg/icon-[name].svg` |
| 배지/에셋 | `assets/badges/`, `assets/misc/` | `assets/badges/`, `assets/misc/` |
| 토큰 원본 | `packages/foundation/reference/`, `packages/foundation/semantic/` | — |

---

## 매핑 규칙

maps/ 디렉토리 대신 **규칙 기반 변환**을 사용한다.

### 토큰 변환: 피그마 변수 → CSS 변수

피그마 변수명에서 CSS 변수명으로 변환하는 규칙:

1. `//` 접두어를 제거한다
2. `/`를 `-`로 변환한다
3. `--sem-color-` 접두어를 붙인다 (시맨틱 색상 토큰)

**예시:**
| 피그마 변수 | CSS 변수 |
|------------|---------|
| `//background/neutral/weak` | `--sem-color-background-neutral-weak` |
| `//content/brand/strong` | `--sem-color-content-brand-strong` |
| `//border/neutral/base` | `--sem-color-border-neutral-base` |

> 레퍼런스 토큰은 `--ref-` 접두어를 사용한다 (예: `--ref-color-neutral-50`).
> 타이포/간격/반지름 등은 해당 카테고리 접두어를 사용한다 (예: `--sem-radius-*`, `--ref-spacing-*`).

### 아이콘 변환: 피그마 컴포넌트명 → SVG 파일명

1. `Icon/` 접두어를 제거한다
2. 소문자로 변환한다
3. `/`를 `-`로 변환한다
4. `icon-` 접두어 + `.svg` 확장자를 붙인다

**예시:**
| 피그마 컴포넌트명 | SVG 파일명 |
|-----------------|-----------|
| `Icon/Alert/Bold` | `icon-alert-bold.svg` |
| `Icon/Bookmark` | `icon-bookmark.svg` |
| `Icon/Camera/Fill` | `icon-camera-fill.svg` |

---

## 8단계 워크플로우

피그마 URL을 받으면 아래 순서를 **반드시** 따른다.

### [0] 프로젝트 설정

1. 사용자에게 구현 파일을 저장할 **프로젝트 폴더 경로**를 물어본다 (예: `~/Desktop/projects/화면명/`).
2. 폴더가 없으면 생성한다 (`mkdir -p`).
3. 디자인 시스템 레포(`~/Desktop/chzzk-storybook/`)와의 **상대 경로**를 파악한다.
4. 이후 모든 구현 파일(HTML, CSS, 에셋 등)은 이 프로젝트 폴더 안에 생성한다.

### [1] 구조 파악

1. 피그마 URL에서 fileKey와 nodeId를 추출한다.
2. `mcp__plugin_figma_figma__get_metadata`로 전체 화면의 노드 트리를 조회한다.
3. 최상위 프레임 내 하위 섹션(프레임) 목록을 추출한다.
4. 각 섹션의 이름, nodeId, 크기를 정리하여 사용자에게 보여준다.
5. 사용자가 목록을 승인/수정한 뒤 다음 단계로 진행한다.

### [2] 구현 전 리포트 — 리소스 정합성 점검

#### 빌드 싱크 확인

구현 시작 전에 **foundation JSON과 tokens.generated.css의 싱크를 확인**한다:

1. `packages/foundation/` 디렉토리 내 JSON 파일 중 최근 수정 시각을 확인한다.
2. `packages/storybook/src/tokens.generated.css`의 생성 시각(파일 헤더의 타임스탬프)을 확인한다.
3. JSON이 CSS보다 최신이면 → `pnpm generate:tokens` 실행하여 재빌드한다.
4. 재빌드 후 변경이 있으면 자동 커밋 + push한다.

#### 리소스 점검

1. 각 섹션의 `mcp__plugin_figma_figma__get_design_context`를 조회한다.
2. 피그마가 참조하는 **모든 리소스**를 추출한다:
   - **색상 토큰** — `var(--xxx)` 형태의 CSS 변수 참조
   - **반지름 토큰** — `var(--small)`, `var(--circular)` 등
   - **투명도 토큰** — `var(--100)` 등
   - **타이포그래피** — 폰트 패밀리, 크기, 굵기, 행간, 자간
   - **아이콘** — 피그마 컴포넌트 이름 (Icon/xxx/yyy)
   - **에셋** — 배지, 일러스트 등 이미지
3. **규칙 기반 변환**으로 CSS 변수/파일명을 도출하고, `tokens.generated.css`와 `packages/icons/svg/`에서 실제 존재 여부를 확인한다.
4. 아래 형식으로 리포트를 출력한다.

```
══════════════════════════════════════
  리소스 정합성 리포트
  화면: [피그마 프레임 이름]
  섹션: [N]개
══════════════════════════════════════

■ 토큰 — 색상
  ✅ 매핑 완료 (N개)
     [피그마 변수명] → [변환 규칙] → [CSS 변수명]
  ⚠️ 매핑 없음 (N개) — 신규 생성 필요
     [피그마 변수명] → [변환 결과] → (tokens.generated.css에 없음)
  ⚠️ 이름 불일치 (N개)
     [피그마 변수명] → [변환 결과] (차이 설명)

■ 토큰 — 반지름
  ✅ 매핑 완료 (N개)
     [피그마 변수명] → [변환 규칙] → [CSS 변수명]

■ 토큰 — 투명도
  ✅ 매핑 완료 (N개)

■ 타이포그래피
  ✅ 매핑 완료 (N종)
     [피그마 스타일명] — 폰트/크기/굵기/행간 모두 토큰 존재
  ⚠️ 토큰 없음 (N건) — 신규 생성 필요
     [속성]: [값] → (tokens.generated.css에 없음)
  ⚠️ 플랫폼 차이 (N건)
     [iOS 폰트] → [웹 대체 폰트] (설명)

■ 아이콘
  ✅ 매핑 완료 (N개)
     [피그마 아이콘명] → [변환 규칙] → [SVG 파일명]
  ⚠️ 매핑 없음 (N개)
     [피그마 아이콘명] → [변환 결과] → (packages/icons/svg/에 없음)

■ 기타 에셋
  ✅ 존재 (N개)
  🆕 다운로드 필요 (N개)

══════════════════════════════════════
  요약: 색상 N/N, 반지름 N/N, 타이포 N/N,
        아이콘 N/N, 에셋 N/N
  → 불일치 N건 처리 후 구현 시작 권장
══════════════════════════════════════
```

5. **불일치 항목 처리:**
   - 색상 토큰 없음 → `packages/foundation/`에 추가 or 유사 토큰으로 대체 (사용자 선택)
   - 타이포 토큰 없음 → `packages/foundation/`에 추가 → `pnpm generate:tokens` 재빌드
   - 이름 불일치 → 동일한 값이면 로컬 토큰으로 자동 대체 (예: figma "default" → local "normal")
   - 플랫폼 폰트 차이 → `--typography-font-style-default`(Pretendard) + 시스템 폰트 fallback 사용
   - 아이콘 없음 → 피그마에서 다운로드 or 유사 아이콘 대체 (사용자 선택)
   - 에셋 없음 → Framelink `download_figma_images`로 자동 다운로드 → `assets/` 저장
6. **토큰/에셋 추가 시 재빌드 + 자동 push:**
   - `packages/foundation/reference/` 또는 `packages/foundation/semantic/`에 토큰 추가
   - `pnpm generate:tokens` → `packages/storybook/src/tokens.generated.css` 갱신
   - 에셋 다운로드 → `assets/` 저장
   - **변경 사항을 디자인 시스템 레포에 자동 커밋 + push:**
     ```
     cd ~/Desktop/chzzk-storybook
     git add packages/foundation/ packages/storybook/src/tokens.generated.css assets/ design.md
     git commit -m "chore: 토큰/에셋 추가 — [추가 내용 요약]"
     git push origin main
     ```
   - push 완료 후 CDN 캐시 반영까지 약 1~2분 대기.
7. 사용자 확인 후 다음 단계로 진행한다.

### [3] 구현 순서 결정

1. 위→아래 순서를 기본으로 한다. 사용자가 우선순위를 변경할 수 있다.
2. [2]에서 확인된 불일치 항목의 처리 방법을 확정한다.

### [4] 섹션별 독립 구현

각 섹션을 순서대로 독립 구현한다:

1. `mcp__plugin_figma_figma__get_design_context(섹션 nodeId)`로 디자인 데이터를 가져온다.
2. 필요한 에셋은 `mcp__Framelink_Figma_MCP__download_figma_images`로 다운로드한다.
3. **반드시 다음 규칙을 지킨다:**

#### 토큰 사용 규칙
- HTML에 `packages/storybook/src/tokens.generated.css`를 import한다.
- 색상, 폰트, 간격, 반지름 등은 **절대 하드코딩하지 않는다**.
- 피그마 변수명 → **매핑 규칙**으로 변환 → CSS 변수(`var(--sem-*)`, `var(--ref-*)`) 사용.

#### 로컬 경로 우선 규칙
- **개발 중에는 디자인 시스템 레포의 상대 경로를 사용한다** (예: `../../chzzk-storybook/packages/storybook/src/tokens.generated.css`).
- [0]에서 파악한 프로젝트 폴더 ↔ 디자인 시스템 레포 간의 상대 경로를 활용한다.
- CDN 경로 전환은 최종 단계([7])에서 수행한다.
- 이렇게 하면 push/CDN 캐시 대기 없이 즉시 로컬에서 확인 가능하다.

#### 데스크톱 프리뷰용 래퍼
- 모바일 디자인을 데스크톱 브라우저에서 확인할 수 있도록, HTML에 **폰 프레임 스타일**을 기본 포함한다:
  ```css
  /* 데스크톱 프리뷰용 폰 프레임 */
  html {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    background: #1a1a1a;
    padding: 24px 0;
  }
  body {
    width: 375px;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    border-radius: 20px;
    box-shadow: 0 0 40px rgba(0,0,0,0.3);
  }
  ```
- 브라우저에서 바로 열어도 모바일 디바이스처럼 보인다.
- 피그마 프레임의 너비가 375px이 아닐 경우, 해당 너비에 맞게 `body { width }` 값을 조정한다.

#### 타이포그래피 사용 규칙
- **폰트 패밀리**: `var(--typography-font-style-decorative)` (Sandoll Nemony2) 또는 `var(--typography-font-style-default)` (Pretendard) 사용.
- **iOS 폰트 대체**: Apple SD Gothic Neo / SF Pro → Pretendard + 시스템 폰트 fallback.
- **크기/굵기/행간/자간**: 모두 토큰 변수 사용 (`--typography-font-size-*`, `--typography-font-weight-*`, `--typography-line-height-*`, `--typography-letter-spacing-*`).
- 피그마의 타이포 스타일명(예: `Label 13/B/KR`)에서 속성을 분해하여 각각의 토큰을 적용한다.
- 토큰에 없는 값은 [2]단계에서 `packages/foundation/`에 추가한 뒤 사용한다.

#### 아이콘 사용 규칙
- 피그마 아이콘명 → **매핑 규칙**(Icon/xxx → icon-xxx.svg)으로 변환 → 로컬 레포의 `packages/icons/svg/[파일명]` 상대 경로 사용.
- 개발 중에는 로컬 경로, 최종 단계에서 CDN 전환.

#### 에셋 사용 규칙
- 배지, 기타 이미지는 로컬 레포의 `assets/` 상대 경로를 사용한다.
- 새 에셋이 필요하면 로컬 레포의 `assets/`에 저장 후 push → CDN 반영.
- 최종 단계에서 CDN 경로로 전환.

### [5] 브라우저 프리뷰 + 사용자 확인

각 섹션 구현 완료 후:

1. `open` 명령으로 구현된 HTML을 **브라우저에 띄운다**.
2. 사용자가 직접 눈으로 확인하고 피드백을 준다.
3. 피드백이 있으면 수정 후 다시 브라우저에서 확인한다.
4. **사용자가 승인한 뒤** 시각적 diff 검증([6])으로 진행한다.

### [6] 구현 후 검증

구현 완료 후 **두 가지 관점**에서 검증한다.

#### A. 리소스 참조 검증

구현된 HTML을 분석하여 아래 리포트를 출력한다:

```
══════════════════════════════════════
  리소스 참조 검증 리포트
══════════════════════════════════════

■ CSS 변수 참조
  ✅ 모두 tokens.generated.css에 정의됨 (N/N)
  ❌ 미정의 변수 사용 (N개)

■ 아이콘 경로
  ✅ 모두 packages/icons/svg/에 존재 (N/N)
  ❌ 누락 파일 (N개)

■ 하드코딩 경고
  ⚠️ [하드코딩된 값] 직접 사용 (line N)
     → [대응 CSS 변수] 사용 권장
══════════════════════════════════════
```

#### B. 시각적 검증 (Diff 루프)

1. **diff 시작 전**, `mcp__plugin_figma_figma__get_design_context`로 해당 섹션의 **정확한 치수**(height, gap, padding, margin)를 추출한다.
2. 추출한 치수를 기준으로 CSS 값을 **먼저 맞춘 뒤** diff를 시작한다 — 불필요한 반복을 최소화한다.
3. 피그마 `get_screenshot`으로 원본 스크린샷을 캡처한다.
4. 구현 결과를 같은 해상도로 스크린샷 캡처한다.
5. `tools/diff.js`로 두 이미지를 비교하여 히트맵을 생성한다.
6. 히트맵의 빨간 영역을 기반으로 CSS를 자동 수정한다.
7. **섹션당 최대 8회 반복**한다.
8. 목표: 텍스트 렌더링 차이만 남는 수준 (레이아웃/색상 100% 일치).

### [7] 전체 조립 + 통합 검증

1. 완성된 섹션들을 하나의 HTML로 조립한다.
2. 조립 결과가 피그마 전체 화면과 동일한지 전체 스크린샷 diff로 최종 확인한다.
3. **로컬 상대 경로를 CDN 경로로 일괄 전환한다:**
   - `../../chzzk-storybook/packages/storybook/src/tokens.generated.css` → CDN URL
   - `../../chzzk-storybook/packages/icons/svg/...` → CDN URL
   - `../../chzzk-storybook/assets/...` → CDN URL
4. 워크플로우 중 디자인 시스템 레포에 변경이 발생했다면 최종 push를 수행한다:
   ```
   cd ~/Desktop/chzzk-storybook
   git add -A
   git diff --cached --quiet || git commit -m "chore: [화면명] 구현 — 토큰/에셋 갱신"
   git push origin main
   ```

---

## 자동 push 규칙

워크플로우 진행 중 디자인 시스템 레포(`~/Desktop/chzzk-storybook/`)에 변경이 발생하는 시점:

| 시점 | 변경 대상 | push 타이밍 |
|------|-----------|-------------|
| [2] 토큰 추가 | `packages/foundation/`, `packages/storybook/src/tokens.generated.css` | 불일치 처리 완료 직후 |
| [2] 에셋 다운로드 | `assets/` | 불일치 처리 완료 직후 |
| [4] 구현 중 에셋 추가 | `assets/` | 해당 섹션 구현 완료 직후 |
| [7] 최종 | 전체 변경 사항 | 통합 검증 완료 직후 |
| `design.md` 수정 | `design.md` | 수정 즉시 |

- 커밋 메시지 형식: `chore: [간단한 변경 내용 요약]`
- push 대상 브랜치: `main`
- push 후 CDN(jsdelivr) 반영까지 약 1~2분 소요.
- 구현 HTML에서는 개발 중 로컬 상대 경로를 사용하므로, CDN 캐시 대기 불필요.

---

## 참고: 다크/라이트 모드

- `tokens.generated.css`의 기본값은 **다크 모드**이다.
- 라이트 모드는 `[data-theme="light"]` 속성으로 전환한다.
- 피그마 디자인이 라이트 모드이면 HTML에 `data-theme="light"` 추가.
