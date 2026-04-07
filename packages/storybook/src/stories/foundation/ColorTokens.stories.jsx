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
