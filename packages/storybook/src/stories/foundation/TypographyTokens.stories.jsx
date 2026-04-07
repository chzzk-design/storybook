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
