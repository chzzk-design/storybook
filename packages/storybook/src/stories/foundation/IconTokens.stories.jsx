import { useState } from 'react';
import styles from './IconTokens.module.css';

// Vite glob import: 모든 아이콘 SVG를 raw string으로 가져옴
const iconModules = import.meta.glob('../../../../icons/svg/*.svg', {
  query: '?raw',
  eager: true,
});

// 파일 경로에서 아이콘 이름 추출 & 정렬
const icons = Object.entries(iconModules)
  .map(([path, mod]) => {
    const fileName = path.split('/').pop().replace('.svg', '');
    return { name: fileName, svg: mod.default };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export default {
  title: 'Foundation/Icon',
};

function IconSample({ name, svg }) {
  return (
    <div className={styles.iconSampleWrapper}>
      <div className={styles.iconSample}>
        <div
          className={styles.iconSvg}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div className={styles.tooltip}>
        <span className={styles.tooltipText}>{name}</span>
      </div>
    </div>
  );
}

export const Icon = {
  render: () => (
    <div className={styles.page}>
      {/* Title Group */}
      <div className={styles.titleGroup}>
        <h1 className={styles.pageTitle}>Icon</h1>
        <div className={styles.description}>
          <div className={styles.bulletList}>
            <span className={styles.dot} />
            <span className={styles.bulletText}>
              치지직의 아이콘은{' '}
              <strong className={styles.bulletTextBold}>
                Stroke 스타일 적용
              </strong>
              을 원칙으로 하나, 명확한 시각적 전달이 필요한 특정 경우에
              제한적으로 Filled 스타일을 활용합니다.
            </span>
          </div>
          <div className={styles.bulletList}>
            <span className={styles.dot} />
            <span className={styles.bulletText}>
              아이콘을 선택할 때 사용성 문제를 피하기 위해 가능한 한 일관된
              스타일을 고수할 것을 권장합니다. 특히, 두 가지 스타일을 하나의
              컴포넌트에 표시하는 경우 사용자 행동과 상호 작용에 대한 혼란을
              야기할 수 있습니다.
            </span>
          </div>
          <div className={styles.bulletList}>
            <span className={styles.dot} />
            <span className={styles.bulletText}>
              모든 아이콘은 24x24 정사각형 Keyline Shapes 그리드에 맞게
              제작합니다.
            </span>
          </div>
          <div className={styles.bulletListAsterisk}>
            <span className={styles.asterisk}>*</span>
            <span
              className={`${styles.bulletText} ${styles.bulletTextMuted}`}
            >
              경우에 따라 얇은 아이콘이 필요한 경우, 12x24 영역에 제작합니다.
            </span>
          </div>
          <div className={styles.bulletList}>
            <span className={styles.dot} />
            <span className={styles.bulletText}>
              아이콘의 형태는 최대한 픽셀에 스냅하도록 하고, 24 사이즈 아이콘
              기준 1.7px의 최소 선 두께를 사용하여 디자인의 일관성을 유지합니다.
            </span>
          </div>
          <div className={styles.bulletListAsterisk}>
            <span className={styles.asterisk}>*</span>
            <span
              className={`${styles.bulletText} ${styles.bulletTextMuted}`}
            >
              경우에 따라 두꺼운 아이콘이 필요한 경우, 2.6px 선 두께로
              제작합니다.
            </span>
          </div>
          <div className={styles.bulletList}>
            <span className={styles.dot} />
            <span className={styles.bulletText}>
              아이콘 그리드에는 상하좌우 2px의 안전 영역을 확보하고, 그 내부에
              그래픽을 배치하면서 광학적으로 균일해 보이도록 정렬합니다.
            </span>
          </div>
          <div className={styles.bulletListAsterisk}>
            <span className={styles.asterisk}>*</span>
            <span
              className={`${styles.bulletText} ${styles.bulletTextMuted}`}
            >
              타 아이콘과 균형감을 맞추기 위해 안전 영역을 사용할 수 있으나,
              이는 최대한 지양해야 합니다.
            </span>
          </div>
          <div className={styles.bulletList}>
            <span className={styles.dot} />
            <span className={styles.bulletText}>
              아이콘 간 균형감 있는 시각 무게와 일관된 밀도를 유지하기 위해,
              그리드 내 실제 그래픽이 차지하는 면적은 가급적 동일 수준이 되도록
              설계합니다. 이는 아이콘 스타일에 따라 도형이 일부 가변적일 수
              있으나, 각 형태에 맞는 구조 예시를 참고해 그래픽 부의 실질 픽셀
              수가 비슷하도록 조정합니다.
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <hr className={styles.divider} />

      {/* Icon List */}
      <div className={styles.iconListSection}>
        <h2 className={styles.sectionTitle}>Icon List</h2>
        <div className={styles.iconGrid}>
          {icons.map((icon) => (
            <IconSample key={icon.name} name={icon.name} svg={icon.svg} />
          ))}
        </div>
      </div>
    </div>
  ),
};
