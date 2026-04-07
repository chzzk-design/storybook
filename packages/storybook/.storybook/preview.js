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
            padding: '1rem',
            background: theme === 'dark' ? '#141517' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000',
            minHeight: '100vh',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
