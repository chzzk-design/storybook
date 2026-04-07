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
