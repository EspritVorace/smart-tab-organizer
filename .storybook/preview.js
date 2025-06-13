// Atlaskit design system addon
import designSystem from '@atlaskit/storybook-addon-design-system';

designSystem();

// Provide a dummy chrome.i18n implementation for getMessage
if (!globalThis.chrome) {
  globalThis.chrome = { i18n: { getMessage: (key) => key } };
}

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};
