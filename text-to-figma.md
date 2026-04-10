# 텍스트 → 코드 구현 워크플로우

피그마 없이 텍스트 설명(+ 선택적 레퍼런스 이미지)으로 화면을 구현한다.
토큰/아이콘/에셋 사용 규칙과 자동 push 규칙은 **`design.md`를 그대로 따른다.**

---

## 디자인 시스템 레포 정보

`design.md`의 "디자인 시스템 레포 정보" 섹션과 동일.

| 리소스 | 로컬 경로 | 용도 |
|--------|-----------|------|
| 토큰 CSS | `packages/storybook/src/tokens.generated.css` | 사용 가능한 전체 CSS 변수 |
| 아이콘 SVG | `packages/icons/svg/icon-[name].svg` | CDN 참조 |
| 에셋 | `assets/badges/`, `assets/misc/` | CDN 참조 |
| 기존 컴포넌트 | `build/index.html` | 재사용 가능 패턴 참조 |
| 토큰 원본 | `packages/foundation/reference/`, `packages/foundation/semantic/` | 신규 토큰 추가 시 |

---

## 6단계 워크플로우

### [1] 입력 수집

1. 사용자에게 두 가지를 요청한다:
   - **텍스트 설명** (필수): 화면 구성 설명 ("상단 탭 + 배너 + 카드 리스트 + 하단 네비게이션")
   - **레퍼런스 이미지** (선택): 스크린샷, 와이어프레임, 손그림 등 이미지 파일 경로
2. 입력이 모호하면 구체적으로 질문한다 ("카드는 가로 스크롤? 세로 리스트?")
3. **레퍼런스 이미지 사용 원칙:**
   - 레퍼런스 이미지는 **레이아웃·구조·배치 패턴의 참고용**이다.
   - 레퍼런스의 색상, 폰트, 간격, 아이콘 스타일은 **무시**하고 디자인 시스템 토큰으로 대체한다.
   - 즉, "어디에 무엇을 배치할지"만 참고하고 "어떻게 보일지"는 디자인 시스템이 결정한다.

### [2] 구조 설계 + 토큰 추천 리포트

1. 텍스트 설명과 레퍼런스 이미지를 분석하여 **섹션 목록**을 추출한다.
   - 레퍼런스 이미지에서는 **섹션 구성과 배치 패턴만** 추출한다.
   - 레퍼런스의 색상·폰트·아이콘 등 비주얼 요소는 추출하지 않는다.
2. 각 섹션에 대해:
   - `build/index.html`에서 재사용 가능한 컴포넌트 매칭
   - 새로 만들어야 하는 컴포넌트 식별
3. `packages/storybook/src/tokens.generated.css`를 참조하여 **토큰 추천 리포트**를 출력한다:

```
══════════════════════════════════════
  구조 설계 + 토큰 추천 리포트
══════════════════════════════════════

■ 섹션 구성 (N개)
  1. [섹션명] — [설명]
     🔄 재사용: .existing-class (build/index.html)
  2. [섹션명] — [설명]
     🆕 신규 생성

■ 토큰 추천
  배경색: var(--sem-color-background-neutral-base)
  카드 배경: var(--sem-color-surface-neutral-weak)
  텍스트 (제목): var(--sem-color-content-neutral-cool-stronger)
         + font-size: var(--typography-font-size-label-18)
         + line-height: var(--typography-line-height-body-23)
  텍스트 (부제): var(--sem-color-content-neutral-cool-base)
  간격: var(--ref-spacing-medium) (12px)
  카드 모서리: var(--sem-radius-medium) (8px)

■ 아이콘 추천
  [의도] → icon-[name].svg (매핑 규칙으로 변환)

■ 에셋 필요 여부
  ✅ 기존 에셋으로 충분 / 🆕 새 에셋 필요 (다운로드 or 생성)

══════════════════════════════════════
```

4. 사용자 확인/수정 후 다음 단계로 진행한다.

### [3] 섹션별 구현

`design.md`의 [4] 구현 규칙을 **그대로** 적용한다:

#### 토큰 사용 규칙 (design.md [4] 참조)
- HTML에 `packages/storybook/src/tokens.generated.css`를 항상 import한다.
- 색상, 폰트, 간격, 반지름 등은 **절대 하드코딩하지 않는다**.
- **매핑 규칙**으로 변환 → CSS 변수(`var(--sem-*)`, `var(--ref-*)`) 사용.

#### 타이포그래피 사용 규칙 (design.md [4] 참조)
- **폰트 패밀리**: `var(--typography-font-style-decorative)` 또는 `var(--typography-font-style-default)` 사용.
- **크기/굵기/행간/자간**: 모두 토큰 변수 사용.
- 토큰에 없는 값은 `packages/foundation/`에 추가 → `pnpm generate:tokens` 재빌드.

#### 아이콘 사용 규칙 (design.md [4] 참조)
- **매핑 규칙**(Icon/xxx → icon-xxx.svg)으로 변환 → 로컬 레포의 `packages/icons/svg/[파일명]` 경로 사용.
- 개발 중에는 로컬 경로, 최종 단계에서 CDN 전환.

#### 에셋 사용 규칙 (design.md [4] 참조)
- 배지, 기타 이미지는 로컬 레포의 `assets/` 경로를 사용한다.
- 새 에셋이 필요하면 로컬 레포의 `assets/`에 저장 후 push → CDN 반영.

#### UI 패턴 규칙 (build/index.html에서 추출)

아래 패턴은 기존 구현체에서 반복 사용되는 치지직 고유 패턴이다. 신규 화면 구현 시 **반드시** 따른다.

**폰트 패밀리 사용 규칙:**
- 섹션 헤더 타이틀 → `.font-nemony` (Sandoll Nemony2, `--typography-font-style-decorative`)
- 숫자, 시간, 점수 → `'SF Pro Display'` 또는 `'SF Pro Text'`
- 한글 본문, 설명 → `.font-default` (`--typography-font-style-default`, Pretendard)
- 영문 메타 정보 → `.font-en` (`'SF Pro Text'`)

**섹션 헤더 패턴:**
- 좌측 타이틀: `font-size: --typography-font-size-label-18`, `line-height: --typography-line-height-body-23`, `color: --sem-color-content-neutral-cool-stronger`
- 우측 "전체보기": `font-size: --typography-font-size-label-13`, `font-weight: 400`, `color: --sem-color-content-neutral-cool-weak`
- 높이: 28px, 좌우 padding: 15px

**카드 리스트 패턴 (가로 스크롤):**
- `display: flex; gap: 14px; padding: 0 15px; overflow-x: auto;`
- 스크롤바 숨김: `::-webkit-scrollbar { display: none; }`
- 카드 너비: 210px (라이브), 썸네일 비율: 210:118

**레이아웃 간격:**
- 섹션 좌우 padding: `15px`
- 섹션 간 gap: `12px` (라이브), `10px` (스케줄)
- 카드 내부 info gap: `4px`
- 메타 정보 gap: `5px`

**스트리머 정보 패턴:**
- 아바타: `20px`, `border-radius: circular`
- 이름: `font-size-13`, `font-weight-700`, `color: cool-strong`
- 인증 배지: `12px × 12px`
- 구분점: `3px` 원형, `color: cool-weaker`

**텍스트 말줄임 패턴:**
- 2줄: `-webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`
- 1줄: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`

**플레이스홀더 이미지 규칙:**
- 썸네일, 프로필, 커버 등 **콘텐츠 이미지는 외부 URL을 사용하지 않는다.**
- 깔끔한 **솔리드 컬러**만으로 플레이스홀더를 표현한다. 텍스트나 아이콘은 넣지 않는다.
- 기본: `.placeholder { background: var(--sem-color-surface-neutral-weaker); }`
- 밝은 변형: `.placeholder--subtle { background: var(--sem-color-surface-neutral-subtle); }`
- `<img>` 태그 대신 빈 `<div class="placeholder">` 패턴을 사용한다.

#### 추가 규칙
- 기존 컴포넌트 재사용 시 `build/index.html`의 CSS 클래스를 그대로 가져온다.
- 신규 컴포넌트는 [2]단계 토큰 추천 리포트의 값으로 구현한다.
- BEM 클래스 명명 규칙을 따른다.

### [4] 프리뷰 + 수정 루프

1. 섹션 하나 구현할 때마다:
   - 브라우저에서 열어 스크린샷 캡처 (`tools/diff.js` 또는 수동)
   - 레퍼런스 이미지가 있으면 **구조·배치 관점에서만** 비교한다 (색상·폰트 등 비주얼 차이는 의도된 것이므로 무시)
   - 사용자에게 프리뷰 제시 → 승인/수정 요청
2. **섹션당 최대 5회 수정** 후 다음으로 진행한다.
3. 레퍼런스 이미지가 없으면 사용자 피드백만으로 루프한다.

### [5] 조립 + 리소스 검증

1. 완성된 섹션들을 하나의 HTML로 조립한다.
2. `design.md` [6A]와 동일한 리소스 참조 검증을 실행한다:

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

3. 워크플로우 중 디자인 시스템 레포에 변경이 발생했으면 `design.md`의 자동 push 규칙에 따라 커밋/push를 수행한다.

### [6] 피그마 디자인 생성 (선택)

1. 사용자에게 "구현 결과를 피그마 파일로도 생성할까요?" 확인한다.
2. **토큰 매핑 가이드 HTML 생성:**
   캡처된 피그마 파일은 CSS 변수가 hex 고정값으로 변환되어 피그마 Variables가 유실된다.
   디자이너가 수동 바인딩할 수 있도록 매핑 가이드를 구현 HTML 오른쪽에 패널로 붙여 **함께 캡처**한다.

   **생성 로직:**
   1. 구현 HTML에서 `var(--xxx)` 패턴을 전체 추출한다.
   2. **매핑 규칙을 역변환**한다 (CSS변수 → 피그마변수):
      - `--sem-color-background-neutral-weak` → `//background/neutral/weak`
      - 규칙: `--sem-color-` 제거 → `-`를 `/`로 → `//` 접두어
   3. 추출된 각 CSS 변수에 대해 역매핑으로 피그마 변수명을 도출한다.
   4. HTML에서 해당 변수가 어디에 사용되었는지 간략 주석을 붙인다.
   5. 카테고리별(색상, 타이포그래피, 간격/반지름)로 분류한다.

   **매핑 가이드 패널 배치:**
   - 구현 화면(모바일 뷰포트)의 **오른쪽**에 매핑 가이드 패널을 배치한다.
   - 레이아웃: `display: flex;` — 좌측 구현 화면 + 우측 가이드 패널
   - 가이드 패널 스타일: 흰색 배경, 고정 너비 `400px`, 읽기 쉬운 본문 폰트
   - 구현 화면과 가이드 패널 사이에 충분한 간격(`40px`)을 둔다.

   **가이드 패널 내용:**
   ```
   ┌─────────────────────────────────┐
   │  토큰 매핑 가이드                  │
   │  (피그마 Variables 수동 바인딩용)    │
   ├─────────────────────────────────┤
   │                                 │
   │  ■ 색상                          │
   │  var(--sem-color-background-neutral-base)  │
   │  → //background/neutral/base    │
   │  사용: body 배경                  │
   │                                 │
   │  var(--sem-color-content-brand-strong)     │
   │  → //content/brand/strong       │
   │  사용: 활성 탭 텍스트              │
   │  ...                            │
   │                                 │
   │  ■ 타이포그래피                    │
   │  var(--typography-font-size-label-18)  │
   │  → //font/size/label/18         │
   │  사용: 섹션 헤더                   │
   │  ...                            │
   │                                 │
   │  ■ 간격/반지름                    │
   │  var(--sem-radius-circular)     │
   │  → //radius/circular            │
   │  사용: 아바타                     │
   │  ...                            │
   │                                 │
   │  ⚠️ 캡처된 색상·간격 등은 고정값입니다.│
   │  위 매핑을 참고하여 피그마 Variables를 │
   │  수동으로 바인딩하세요.             │
   └─────────────────────────────────┘
   ```

3. 승인 시 `generate_figma_design` 도구로 HTML → 피그마 변환:
   - 구현 화면 + 매핑 가이드 패널이 합쳐진 HTML을 브라우저로 연다
   - `generate_figma_design`으로 캡처 → 신규 피그마 파일 or 기존 파일에 추가
   - captureId로 폴링하여 완료 확인
4. 생성된 피그마 파일 URL을 사용자에게 전달한다.
5. 이후 피그마에서 디자이너가 수정/보완 → `figma-to-code`로 다시 코드 동기화하는 순환 워크플로우가 가능하다.

---

## 자동 push 규칙

`design.md`의 "자동 push 규칙" 섹션을 그대로 따른다.

| 시점 | 변경 대상 | push 타이밍 |
|------|-----------|-------------|
| [2] 토큰 추가 | `packages/foundation/`, `packages/storybook/src/tokens.generated.css` | 추천 확정 후 |
| [3] 구현 중 에셋 추가 | `assets/` | 해당 섹션 구현 완료 직후 |
| [5] 최종 | 전체 변경 사항 | 통합 검증 완료 직후 |

---

## 참고: 다크/라이트 모드

`design.md`의 "다크/라이트 모드" 섹션과 동일.
- `tokens.generated.css`의 기본값은 **다크 모드**이다.
- 라이트 모드는 `[data-theme="light"]` 속성으로 전환한다.
