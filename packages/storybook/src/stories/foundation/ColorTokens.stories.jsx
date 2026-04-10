import { useState, useEffect } from 'react';
import refColors from '@chzzk-ds/tokens/reference/color.json';
import styles from './ColorTokens.module.css';

export default {
  title: 'Foundation/Color',
};

// 피그마 기준 컬러 그룹 정렬 순서
const COLOR_GROUP_ORDER = [
  'neutral',
  'cool.gray',
  'white.alpha',
  'black.alpha',
  'brand.neon',
  'brand.neon.alpha',
  'brand',
  'brand.alpha',
  'red',
  'crimson',
  'brick',
  'pumpkin',
  'orange',
  'yellow',
  'ochre',
  'amber',
  'brass',
  'camel',
  'green',
  'moss',
  'cyan',
  'mint',
  'teal',
  'blue',
  'sky.blue',
  'indigo',
  'violet',
  'dark.violet',
  'lilac',
  'purple',
  'lavender',
  'lavender.deprecated',
  'lime',
];

// ref.color에서 플랫한 그룹 목록 추출
function getColorGroups(obj, prefix = '') {
  const groups = [];
  const directTokens = {};
  const subGroups = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && value.$value) {
      directTokens[key] = value;
    } else if (value && typeof value === 'object') {
      subGroups[key] = value;
    }
  }

  if (Object.keys(directTokens).length > 0) {
    const displayName = prefix
      .split('.')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    const cssPrefix = prefix.replace(/\./g, '-');
    groups.push({ name: displayName, cssPrefix, tokens: directTokens });
  }

  for (const [key, value] of Object.entries(subGroups)) {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    groups.push(...getColorGroups(value, newPrefix));
  }

  return groups;
}

function ColorSet({ groupName, cssPrefix, tokens, id }) {
  return (
    <div className={styles.colorSet} id={id}>
      <div className={styles.labelArea}>
        <span className={styles.colorSetName}>{groupName}</span>
      </div>
      <div className={styles.table}>
        <div className={styles.headerRow}>
          <div className={`${styles.headerCell} ${styles.cellName}`}>
            Reference Color Token
          </div>
          <div className={`${styles.headerCell} ${styles.cellHex}`}>Hex</div>
          <div className={`${styles.headerCell} ${styles.cellChip}`}>Chip</div>
        </div>
        {Object.entries(tokens).map(([key, token]) => {
          const raw = token.$value.toUpperCase();
          const hasAlpha = raw.length === 9;
          const hex = hasAlpha ? raw.slice(0, 7) : raw;
          const opacity = hasAlpha
            ? parseFloat((parseInt(raw.slice(7, 9), 16) / 255).toFixed(2)).toString()
            : null;
          const varName = `--ref-color-${cssPrefix}-${key}`;
          return (
            <div key={key} className={styles.dataRow}>
              <div className={`${styles.dataCell} ${styles.cellName}`}>
                {varName}
              </div>
              <div className={`${styles.dataCell} ${styles.cellHex}`}>
                <div className={styles.hexGroup}>
                  <span>{hex}</span>
                  {opacity !== null && (
                    <span className={styles.hexOpacity}>{opacity}</span>
                  )}
                </div>
              </div>
              <div className={`${styles.chipCell} ${styles.cellChip}`}>
                <div
                  className={styles.chipSwatch}
                  style={{ backgroundColor: token.$value }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ReferenceColor = {
  render: () => {
    const unsortedGroups = getColorGroups(refColors.ref.color);
    const colorGroups = [...unsortedGroups].sort((a, b) => {
      const aIdx = COLOR_GROUP_ORDER.indexOf(a.cssPrefix.replace(/-/g, '.'));
      const bIdx = COLOR_GROUP_ORDER.indexOf(b.cssPrefix.replace(/-/g, '.'));
      const aOrder = aIdx === -1 ? 999 : aIdx;
      const bOrder = bIdx === -1 ? 999 : bIdx;
      return aOrder - bOrder;
    });
    const [activeGroup, setActiveGroup] = useState(colorGroups[0]?.cssPrefix || '');

    // 스크롤 시 활성 그룹 업데이트 — iframe 내부 또는 window 스크롤 감지
    useEffect(() => {
      const handleScroll = () => {
        const sets = document.querySelectorAll('[id^="colorset-"]');
        let closest = '';
        let closestDist = Infinity;

        for (const set of sets) {
          const rect = set.getBoundingClientRect();
          const dist = Math.abs(rect.top - 100);
          if (dist < closestDist) {
            closestDist = dist;
            closest = set.id.replace('colorset-', '');
          }
        }
        if (closest) setActiveGroup(closest);
      };

      // Storybook iframe 내부 스크롤 감지
      const scrollContainer = document.querySelector('#storybook-root')?.parentElement || window;
      scrollContainer.addEventListener('scroll', handleScroll, true);
      window.addEventListener('scroll', handleScroll, true);

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, []);

    const scrollToGroup = (cssPrefix) => {
      setActiveGroup(cssPrefix);
      const el = document.getElementById(`colorset-${cssPrefix}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

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

        {/* Reference Color Section */}
        <div className={styles.section} style={{ paddingTop: '32px', paddingBottom: '32px' }}>
          <div className={styles.sectionTitleGroup}>
            <h2 className={styles.sectionTitle}>Reference Color</h2>
            <p className={styles.sectionDescription}>
              Reference 컬러는 사용 맥락에 구애받지 않는 컬러 팔레트입니다.
              컬러의 각 단계(5, 10, 20, …)는 명도비가 일정하도록 정의했고 UI
              적용을 위해 조정이 필요한 경우 미세하게 수정되었습니다. Reference
              컬러는 #000000와 같은 16진수 값을 기본값으로 갖습니다. Reference
              컬러 토큰은 Semantic 컬러 토큰에 참조합니다.
            </p>
          </div>
        </div>

        {/* Divider */}
        <hr className={styles.divider} />

        {/* Token List (Sticky) */}
        <div className={styles.tokenListSticky} style={{ paddingTop: '32px' }}>
          {/* Left Panel */}
          <div className={styles.leftPanel}>
            <h2 className={styles.sectionTitle}>Token List</h2>
            <div className={styles.shortcutList}>
              {colorGroups.map((group) => (
                <button
                  key={group.cssPrefix}
                  className={`${styles.shortcutItem} ${activeGroup === group.cssPrefix ? styles.shortcutItemActive : styles.shortcutItemInactive}`}
                  onClick={() => scrollToGroup(group.cssPrefix)}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Set List */}
          <div className={styles.colorSetListVertical}>
            {colorGroups.map((group) => (
              <ColorSet
                key={group.cssPrefix}
                id={`colorset-${group.cssPrefix}`}
                groupName={group.name}
                cssPrefix={group.cssPrefix}
                tokens={group.tokens}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
};
