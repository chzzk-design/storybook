import { useState, useRef, useMemo, useEffect } from 'react';
import semColors from '@chzzk-ds/tokens/semantic/color.json';
import refColors from '@chzzk-ds/tokens/reference/color.json';
import styles from './SemanticColorTokens.module.css';

export default {
  title: 'Foundation/Color',
};

// Reference lookup map
function buildRefLookup(obj, prefix = '') {
  const map = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && value.$value) {
      map[path] = value.$value;
    } else if (value && typeof value === 'object') {
      Object.assign(map, buildRefLookup(value, path));
    }
  }
  return map;
}

const refLookup = buildRefLookup(refColors);

function resolveRef(ref) {
  if (!ref || typeof ref !== 'string') return ref;
  const match = ref.match(/^\{(.+)\}$/);
  if (!match) return ref;
  return refLookup[match[1]] || ref;
}

function refToCssVar(ref) {
  if (!ref || typeof ref !== 'string') return ref;
  const match = ref.match(/^\{(.+)\}$/);
  if (!match) return ref;
  return '--' + match[1].replace(/\./g, '-');
}

// Extract tokens, supporting dark/light mode
function extractTokens(obj, prefix = '') {
  const tokens = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$value' || key === '$type' || key === 'light') continue;
    if (value && typeof value === 'object' && value.$value) {
      const semVar = `--${prefix}${prefix ? '-' : ''}${key}`.replace(/\./g, '-');
      tokens.push({
        semanticVar: semVar,
        darkRef: value.$value,
        lightRef: value.light || value.$value,
        darkRefDisplay: refToCssVar(value.$value),
        lightRefDisplay: refToCssVar(value.light || value.$value),
        darkHex: resolveRef(value.$value),
        lightHex: resolveRef(value.light || value.$value),
      });
      // nested sub-tokens (e.g. "static")
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subKey === '$value' || subKey === '$type' || subKey === 'light') continue;
        if (subValue && typeof subValue === 'object') {
          const subPrefix = `${prefix}${prefix ? '-' : ''}${key}`;
          tokens.push(...extractTokens({ [subKey]: subValue }, subPrefix));
        }
      }
    } else if (value && typeof value === 'object') {
      const newPrefix = `${prefix}${prefix ? '-' : ''}${key}`;
      tokens.push(...extractTokens(value, newPrefix));
    }
  }
  return tokens;
}

// 수동 그룹 매핑 — 섹션별 표시할 그룹과 JSON 경로
// shallow: true → 직접 토큰 + 직접 자식 중 $value가 있는 것만 (하위 그룹 제외)
// shallow: false (기본) → 재귀적으로 모든 하위 토큰 포함
const SEMANTIC_GROUP_MAP = {
  background: [
    { shortcut: 'Neutral', paths: ['neutral'] },
  ],
  surface: [
    { shortcut: 'Neutral', paths: ['neutral'], shallow: true },
    { shortcut: 'Neutral Alpha', paths: ['neutral.alpha'] },
    { shortcut: 'Brand', paths: ['brand'], shallow: true },
    { shortcut: 'Brand Alpha', paths: ['brand.alpha'] },
    { shortcut: 'Interaction', paths: ['interaction'] },
    { shortcut: 'Accent', paths: ['accent'] },
    { shortcut: 'Function', paths: ['function'] },
    { shortcut: 'Theme', paths: ['theme'] },
  ],
  content: [
    { shortcut: 'Neutral', paths: ['neutral'], shallow: true },
    { shortcut: 'Neutral Alpha', paths: ['neutral.alpha'] },
    { shortcut: 'Brand', paths: ['brand'], shallow: true },
    { shortcut: 'Brand Alpha', paths: ['brand.alpha'] },
    { shortcut: 'Accent', paths: ['accent'] },
    { shortcut: 'Function', paths: ['function'] },
    { shortcut: 'Theme', paths: ['theme'] },
  ],
  border: [
    { shortcut: 'Neutral', paths: ['neutral'], shallow: true },
    { shortcut: 'Neutral Alpha', paths: ['neutral.alpha'] },
    { shortcut: 'Brand', paths: ['brand'], shallow: true },
    { shortcut: 'Brand Alpha', paths: ['brand.alpha'] },
    { shortcut: 'Accent', paths: ['accent'] },
    { shortcut: 'Theme', paths: ['theme'] },
  ],
};

// shallow extractTokens — 직접 $value가 있는 것 + 그 안의 nested(static 등)만, 하위 그룹 폴더 제외
function extractTokensShallow(obj, prefix) {
  const tokens = [];
  for (const [key, value] of Object.entries(obj)) {
    if (key === '$value' || key === '$type' || key === 'light') continue;
    if (!value || typeof value !== 'object') continue;

    if ('$value' in value) {
      const semVar = `--${prefix}-${key}`;
      tokens.push({
        semanticVar: semVar,
        darkRef: value.$value,
        lightRef: value.light || value.$value,
        darkRefDisplay: refToCssVar(value.$value),
        lightRefDisplay: refToCssVar(value.light || value.$value),
        darkHex: resolveRef(value.$value),
        lightHex: resolveRef(value.light || value.$value),
      });
      // nested sub-tokens (e.g. static)
      for (const [sk, sv] of Object.entries(value)) {
        if (sk === '$value' || sk === '$type' || sk === 'light') continue;
        if (sv && typeof sv === 'object') {
          tokens.push(...extractTokens({ [sk]: sv }, `${prefix}-${key}`));
        }
      }
    }
    // 하위 그룹(폴더)은 무시
  }
  return tokens;
}

// paths에 해당하는 JSON 노드를 찾아서 토큰 추출
function getNodeAtPath(obj, dotPath) {
  const keys = dotPath.split('.');
  let cur = obj;
  for (const key of keys) {
    if (!cur || !cur[key]) return null;
    cur = cur[key];
  }
  return cur;
}

function getSemanticGroups() {
  const categories = semColors.sem.color;
  const groups = [];

  for (const [catKey, groupDefs] of Object.entries(SEMANTIC_GROUP_MAP)) {
    const catValue = categories[catKey];
    if (!catValue) continue;
    const catLabel = catKey.charAt(0).toUpperCase() + catKey.slice(1);

    for (const groupDef of groupDefs) {
      const allTokens = [];
      for (const dotPath of groupDef.paths) {
        const node = getNodeAtPath(catValue, dotPath);
        if (!node) continue;
        const cssPath = `sem-color-${catKey}-${dotPath.replace(/\./g, '-')}`;
        const tokens = groupDef.shallow
          ? extractTokensShallow(node, cssPath)
          : extractTokens(node, cssPath);
        allTokens.push(...tokens);
      }
      if (allTokens.length > 0) {
        // 소제목: 세그먼트별 구분 (Brand Alpha → Brand / Alpha)
        const displayName = `${catLabel} / ${groupDef.shortcut.replace(/\s+/g, ' / ')}`;
        groups.push({
          name: displayName,
          section: catLabel,
          shortcut: groupDef.shortcut,
          tokens: allTokens,
        });
      }
    }
  }
  return groups;
}

// LNB에서 사용할 섹션별 shortcut 목록 생성
function buildLnbSections(groups) {
  const sectionMap = {};
  for (const group of groups) {
    const section = group.section;
    if (!sectionMap[section]) sectionMap[section] = [];
    sectionMap[section].push({ shortcut: group.shortcut, groupName: group.name });
  }
  return Object.entries(sectionMap).map(([title, items]) => ({ title, items }));
}

// Dark/Light toggle icons — 디자인 시스템 아이콘 활용
import darkModeIconRaw from '../../../../icons/svg/icon-dark-mode.svg?raw';
import lightModeIconRaw from '../../../../icons/svg/icon-light-mode.svg?raw';

function MoonIcon({ className }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: darkModeIconRaw }}
    />
  );
}

function SunIcon({ className }) {
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: lightModeIconRaw }}
    />
  );
}

function ColorSet({ groupName, tokens, mode }) {
  return (
    <div className={styles.colorSet}>
      <div className={styles.labelArea}>
        <span className={styles.colorSetName}>{groupName}</span>
      </div>
      <div className={styles.table}>
        <div className={styles.headerRow}>
          <div className={`${styles.headerCell} ${styles.cellSemantic}`}>
            Semantic Color Token
          </div>
          <div className={`${styles.headerCell} ${styles.cellReference}`}>
            Reference Color Token / Hex
          </div>
          <div className={`${styles.headerCell} ${styles.cellChip}`}>Chip</div>
        </div>
        {tokens.map((token) => {
          const refDisplay = mode === 'dark' ? token.darkRefDisplay : token.lightRefDisplay;
          const hex = mode === 'dark' ? token.darkHex : token.lightHex;
          return (
            <div key={token.semanticVar} className={styles.dataRow}>
              <div className={`${styles.dataCell} ${styles.cellSemantic}`}>
                {token.semanticVar}
              </div>
              <div className={`${styles.dataCell} ${styles.cellReference}`}>
                {refDisplay}
              </div>
              <div className={`${styles.chipCell} ${styles.cellChip}`}>
                <div
                  className={styles.chipSwatch}
                  style={{ backgroundColor: hex }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const SemanticColor = {
  render: () => {
    const [mode, setMode] = useState('dark');
    const [activeGroup, setActiveGroup] = useState('');
    const shortcutListRef = useRef(null);
    const scrollThumbRef = useRef(null);
    const scrollTimerRef = useRef(null);
    const [thumbVisible, setThumbVisible] = useState(false);
    const groups = useMemo(() => getSemanticGroups(), []);
    const lnbSections = useMemo(() => buildLnbSections(groups), [groups]);
    const groupRefs = useRef([]);

    // LNB 커스텀 스크롤바: 스크롤 시 노출, 1s 후 fade out
    useEffect(() => {
      const el = shortcutListRef.current;
      const thumb = scrollThumbRef.current;
      if (!el || !thumb) return;

      const updateThumb = () => {
        const { scrollTop, scrollHeight, clientHeight } = el;
        if (scrollHeight <= clientHeight) {
          thumb.style.display = 'none';
          return;
        }
        thumb.style.display = 'block';
        const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 40);
        const thumbTop = (scrollTop / scrollHeight) * clientHeight;
        thumb.style.height = thumbHeight + 'px';
        thumb.style.top = thumbTop + 'px';
      };

      const handleScroll = () => {
        setThumbVisible(true);
        updateThumb();
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = setTimeout(() => setThumbVisible(false), 1000);
      };

      el.addEventListener('scroll', handleScroll);
      updateThumb();
      return () => {
        el.removeEventListener('scroll', handleScroll);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      };
    }, [lnbSections]);

    // 스크롤 위치 기반 하이라이팅
    useEffect(() => {
      const handleScroll = () => {
        let closestIndex = -1;
        let closestDist = Infinity;
        for (let i = 0; i < groupRefs.current.length; i++) {
          const el = groupRefs.current[i];
          if (!el) continue;
          const dist = Math.abs(el.getBoundingClientRect().top - 100);
          if (dist < closestDist) {
            closestDist = dist;
            closestIndex = i;
          }
        }
        if (closestIndex !== -1) {
          setActiveGroup(groups[closestIndex].name);
        }
      };

      const scrollContainer = document.querySelector('#storybook-root')?.parentElement || window;
      scrollContainer.addEventListener('scroll', handleScroll, true);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [groups]);

    return (
      <div className={styles.page}>
        {/* Title Group */}
        <div className={styles.section} style={{ paddingBottom: '32px' }}>
        <div className={styles.titleGroup}>
          <h1 className={styles.pageTitle}>Color</h1>
          <div className={styles.description}>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                치지직의 컬러는 디자인의 일관성을 유지하고 올바른 색상 사용에
                따른 접근성이 보장될 수 있도록 일정한 규칙에 따라
                정의되었습니다.
              </span>
            </div>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                컬러는 Reference, Semantic로 나누어 필요한 컬러를 상황에 따라
                활용할 수 있도록 하였습니다.
              </span>
            </div>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                제한된 범위 내에서 색상을 활용하는데 어려움이 없도록 기본
                팔레트인 Reference 컬러에 충분한 컬러를 제공하고, 이를 사용
                맥락에 따라 Semantic 컬러에 참조했습니다.
              </span>
            </div>
          </div>
        </div>
        </div>

        {/* Divider */}
        <hr className={styles.divider} />

        {/* Semantic Color Section */}
        <div className={styles.section} style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          <div className={styles.sectionTitleGroup}>
          <h2 className={styles.sectionTitle}>Semantic Color</h2>
          <p className={styles.sectionDescription}>
            Semantic 컬러는 앞서 정의한 Reference 컬러를 사용 맥락에 맞는
            이름으로 재정의하여 의도된 목적에 맞게 사용될 수 있도록 참조한
            컬러입니다. 대표적인 Semantic 컬러의 사용 맥락은 아래와 같이
            분류합니다.
          </p>
          <div className={styles.description}>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                Background: 바탕이 되는 배경
              </span>
            </div>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                Surface: Background보다 Z축에서 앞서 위치하는 배경 요소.
                Content를 담는 모든 컨테이너, 레이어, 패널, 사이드바 등이
                해당되며, 필요에 따라 Elevation 효과를 적용해서 위계를 구분
              </span>
            </div>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                Content: 아이콘, 텍스트 등 Background 및 Surface 위에
                위치하는 요소
              </span>
            </div>
            <div className={styles.bulletList}>
              <span className={styles.dot} />
              <span className={styles.bulletText}>
                Border: 콘텐츠를 그룹화하고 분리하는 데 도움을 주는 테두리 및
                구분선
              </span>
            </div>
          </div>
        </div>
        </div>

        {/* Diagram Image */}
        <div className={styles.section} style={{ paddingBottom: '32px' }}>
          <div className={styles.diagramImage}>
          <img src="/semantic-color-diagram.png" alt="Semantic Color Diagram" />
        </div>
        </div>

        {/* Divider */}
        <hr className={styles.divider} />

        {/* Token List (Sticky) */}
        <div className={styles.tokenListSticky} style={{ paddingTop: '32px' }}>
          {/* Left Panel */}
          <div className={styles.leftPanel}>
            <div className={styles.tokenListHeader}>
              <h2 className={styles.sectionTitle}>Token List</h2>
              <div className={styles.themeToggle}>
                <button
                  className={`${styles.toggleButton} ${mode === 'dark' ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
                  onClick={() => setMode('dark')}
                >
                  <MoonIcon className={styles.toggleIcon} />
                  Dark
                </button>
                <button
                  className={`${styles.toggleButton} ${mode === 'light' ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
                  onClick={() => setMode('light')}
                >
                  <SunIcon className={styles.toggleIcon} />
                  Light
                </button>
              </div>
            </div>
            <div className={styles.shortcutListWrapper}>
              <div className={styles.shortcutList} ref={shortcutListRef}>
                {lnbSections.map((section) => (
                  <div key={section.title} className={styles.lnbSection}>
                    <span className={styles.lnbSectionTitle}>{section.title}</span>
                    {section.items.map((item) => (
                      <button
                        key={item.groupName}
                        className={`${styles.shortcutItem} ${activeGroup === item.groupName ? styles.shortcutItemActive : styles.shortcutItemInactive}`}
                        onClick={() => {
                          const idx = groups.findIndex((g) => g.name === item.groupName);
                          if (idx !== -1 && groupRefs.current[idx]) {
                            groupRefs.current[idx].scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        {item.shortcut}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div
                ref={scrollThumbRef}
                className={`${styles.scrollThumb} ${thumbVisible ? styles.scrollThumbVisible : ''}`}
              />
            </div>
          </div>

          {/* Color Set List */}
          <div className={styles.colorSetList}>
            {groups.map((group, index) => (
              <div
                key={group.name}
                ref={(el) => { groupRefs.current[index] = el; }}
              >
                <ColorSet
                  groupName={group.name}
                  tokens={group.tokens}
                  mode={mode}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
