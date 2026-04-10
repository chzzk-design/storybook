import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming';
import {
  VERSION,
  fontFamily,
  // Typography composite (세트 단위)
  sem_typography_title_pretendard_20_700,
  sem_typography_label_pretendard_16_400,
  sem_typography_label_pretendard_14_400,
  sem_typography_label_pretendard_14_700,
  // Spacing
  spacing_x_small,
  spacing_medium,
  spacing_large,
  // Color tokens (dark)
  color_background_neutral_weak,
  color_background_neutral_base,
  color_surface_neutral_weakest,
  color_surface_neutral_weak,
  color_surface_neutral_base,
  color_content_neutral_primary,
  color_content_neutral_inverse,
  color_content_neutral_alpha_strong,
  color_content_brand_weaker,
  color_content_brand_base,
  color_content_brand_strong,
  color_border_neutral_weak,
  color_border_neutral_weaker,
  color_border_neutral_alpha_base,
  // Interaction
  color_surface_interaction_lighten_normal,
  color_surface_interaction_lighten_hovered,
  color_surface_interaction_lighten_selected,
} from './tokens.generated.js';

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'CDS',
    brandUrl: '/',
    brandTarget: '_self',

    // Storybook UI 컬러 — 시맨틱 토큰 매핑
    appBg: color_surface_neutral_weak,               // 사이드바 배경 — sem.color.surface.neutral.weak
    appContentBg: color_background_neutral_base,        // 캔버스/Docs 배경 — sem.color.background.neutral.base
    appBorderColor: color_border_neutral_weak,         // 구분선 — sem.color.border.neutral.weak

    textColor: color_content_neutral_primary,                // 본문 텍스트 — sem.color.content.neutral.primary
    textMutedColor: color_content_neutral_alpha_strong,      // 보조 텍스트 — sem.color.content.neutral.alpha.strong

    colorPrimary: color_content_brand_base,          // 메인 액센트
    colorSecondary: color_content_brand_base,        // 선택 상태, 링크

    barBg: color_surface_neutral_weak,                // 상단 툴바 배경 — sem.color.surface.neutral.weak
    barTextColor: color_content_neutral_primary,     // 툴바 텍스트
    barSelectedColor: color_content_brand_base,      // 툴바 활성 탭

    inputBg: color_surface_neutral_weakest,          // 검색창 배경
    inputBorder: color_border_neutral_weak,          // 입력 필드 테두리
    inputTextColor: color_content_neutral_primary,   // 입력 텍스트

    fontBase: fontFamily,
    fontCode: 'monospace',

  }),
});

function customizeBrand() {
  const header = document.querySelector('.sidebar-header');
  if (!header) return false;

  const brandArea = header.querySelector('div');
  if (!brandArea) return false;

  const link = brandArea.querySelector('a');
  if (!link) return false;

  if (link.dataset.customized === 'true' && link.querySelector('svg.chzzk-logo')) return true;

  link.innerHTML = '';
  link.dataset.customized = 'true';

  // 로고 — 인라인 SVG로 currentColor 지원
  const logo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  logo.setAttribute('width', '44');
  logo.setAttribute('height', '44');
  logo.setAttribute('viewBox', '0 0 100 100');
  logo.setAttribute('fill', 'none');
  logo.className.baseVal = 'chzzk-logo';
  logo.style.cssText = `width:44px;height:44px;flex-shrink:0;color:${color_content_brand_strong};`;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M85.8608 90.3366V69.3393H54.3153L89.0483 21.4196H60.9046L69.4251 9.66339H41.2814L18.0207 41.7554H46.1644L10.9519 90.3366H85.8608Z');
  path.setAttribute('fill', 'currentColor');
  logo.appendChild(path);

  // 텍스트 영역
  const textArea = document.createElement('div');
  textArea.style.cssText = 'display:flex;flex-direction:column;min-width:0;';

  // 타이틀 — title-pretendard-20-700 합성 토큰
  const t = sem_typography_title_pretendard_20_700;
  const title = document.createElement('span');
  title.textContent = 'CDS';
  title.style.cssText = `font-family:${t.fontFamily};font-size:${t.fontSize};font-weight:${t.fontWeight};letter-spacing:${t.letterSpacing};line-height:${t.lineHeight};color:${color_content_neutral_primary};`;

  // 버전 — label-pretendard-16-400 합성 토큰
  const v = sem_typography_label_pretendard_16_400;
  const version = document.createElement('span');
  version.textContent = `v${VERSION}`;
  version.style.cssText = `font-family:${v.fontFamily};font-size:${v.fontSize};font-weight:${v.fontWeight};letter-spacing:${v.letterSpacing};line-height:${v.lineHeight};color:${color_content_neutral_alpha_strong};`;

  textArea.appendChild(title);
  textArea.appendChild(version);

  // 링크 — gap: spacing x-small (8px), Storybook 내부 margin/padding/border 오버라이드
  link.style.cssText = `display:flex !important;align-items:center;gap:${spacing_medium};text-decoration:none;overflow:hidden;min-width:0;margin:0 !important;padding:0 !important;border:none !important;border-radius:0 !important;`;

  // sidebar-header: padding-left 제거
  header.style.setProperty('padding-left', '0', 'important');

  // 브랜드 영역 — margin-right: spacing large (16px)
  brandArea.style.setProperty('margin', '0', 'important');
  brandArea.style.setProperty('padding', '0', 'important');
  brandArea.style.setProperty('margin-right', spacing_large, 'important');
  brandArea.style.setProperty('width', 'auto', 'important');
  brandArea.style.setProperty('flex', '1 1 0%', 'important');
  brandArea.style.setProperty('min-width', '0', 'important');

  link.appendChild(logo);
  link.appendChild(textArea);

  return true;
}

// 사이드바 border-right (e.color.border) 오버라이드
function fixSidebarBorder() {
  const els = document.querySelectorAll('div[class^="css-"]');
  for (const el of els) {
    const style = getComputedStyle(el);
    if (style.gridArea === 'sidebar' || style.getPropertyValue('grid-area') === 'sidebar') {
      el.style.setProperty('border-right-color', color_border_neutral_weak, 'important');
      return;
    }
  }
}

// 사이드바 항목 타이포그래피 + 아이콘/레이블 중앙 정렬
function fixSidebarTypography() {
  const items = document.querySelectorAll('.sidebar-container [data-nodetype]');
  for (const item of items) {
    const nodeType = item.dataset.nodetype;
    const isSelected = item.getAttribute('aria-current') === 'true' ||
                       item.dataset.selected === 'true';

    // root(FOUNDATION 등 대분류) → 항상 700, 나머지 → 선택 시 700 / 기본 400
    const isRoot = nodeType === 'root';
    const typo = (isRoot || isSelected) ? sem_typography_label_pretendard_14_700 : sem_typography_label_pretendard_14_400;

    // 아이콘과 레이블 중앙 정렬
    item.style.setProperty('display', 'flex', 'important');
    item.style.setProperty('align-items', 'center', 'important');

    // 아이콘 색상: 상위(component/group) → brand.strong, 하위(story/document) → brand.weaker
    const isGroupType = nodeType === 'component' || nodeType === 'group' || nodeType === 'root';
    const iconColor = isGroupType ? color_content_brand_strong : color_content_brand_weaker;
    const svgs = item.querySelectorAll('svg');
    for (const svg of svgs) {
      svg.style.setProperty('color', iconColor, 'important');
    }

    const links = item.querySelectorAll('a, button, span');
    for (const el of links) {
      el.style.setProperty('font-family', typo.fontFamily, 'important');
      el.style.setProperty('font-size', typo.fontSize, 'important');
      el.style.setProperty('line-height', typo.lineHeight, 'important');
      el.style.setProperty('font-weight', typo.fontWeight, 'important');
      el.style.setProperty('letter-spacing', typo.letterSpacing, 'important');
      el.style.setProperty('display', 'flex', 'important');
      el.style.setProperty('align-items', 'center', 'important');
    }
  }
}

// 인터랙션 스타일 오버라이드 — CSS 주입
function injectInteractionStyles() {
  if (document.getElementById('chzzk-interaction-styles')) return;
  const style = document.createElement('style');
  style.id = 'chzzk-interaction-styles';
  style.textContent = `
    /* normal — 투명 */
    .sidebar-container .sidebar-item {
      background: ${color_surface_interaction_lighten_normal} !important;
      --tree-node-background-hover: ${color_surface_interaction_lighten_normal} !important;
      box-shadow: none !important;
    }
    /* hover */
    .sidebar-container .sidebar-item:hover,
    .sidebar-container .sidebar-item:focus {
      background: ${color_surface_interaction_lighten_hovered} !important;
      --tree-node-background-hover: ${color_surface_interaction_lighten_hovered} !important;
      box-shadow: none !important;
    }
    /* selected */
    .sidebar-container .sidebar-item[data-selected="true"] {
      background: ${color_surface_interaction_lighten_selected} !important;
      --tree-node-background-hover: ${color_surface_interaction_lighten_selected} !important;
      box-shadow: none !important;
    }
    /* selected + hover */
    .sidebar-container .sidebar-item[data-selected="true"]:hover,
    .sidebar-container .sidebar-item[data-selected="true"]:focus {
      background: ${color_surface_interaction_lighten_selected} !important;
    }
    /* 컨텍스트 하이라이트 box-shadow 확산 제거 */
    .sidebar-container .sidebar-item * {
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(style);
}

const observer = new MutationObserver(() => {
  injectInteractionStyles();
  customizeBrand();
  fixSidebarBorder();
  fixSidebarTypography();
});

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}

setInterval(() => { injectInteractionStyles(); customizeBrand(); fixSidebarBorder(); fixSidebarTypography(); }, 500);
