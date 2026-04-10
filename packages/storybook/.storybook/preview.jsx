import '../src/tokens.generated.css';

/** @type {import('@storybook/react').Preview} */
const preview = {
  globalTypes: {
    theme: {
      description: '테마 전환',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'dark', title: 'Dark (기본)' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme;
      return (
        <div
          data-theme={theme === 'light' ? 'light' : undefined}
          style={{
            padding: '32px',
            background: 'var(--sem-color-background-neutral-base)',
            color: 'var(--sem-color-content-neutral-primary)',
            minHeight: '100vh',
            boxSizing: 'border-box',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
