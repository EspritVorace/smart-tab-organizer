// Atlaskit design system addon
import designSystem from '@atlaskit/storybook-addon-design-system/preview';

// Provide a dummy chrome.i18n implementation for getMessage
if (!globalThis.chrome) {
  globalThis.chrome = { i18n: { getMessage: (key) => key } };
}

export default {
  ...designSystem,
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' }
  }
};
