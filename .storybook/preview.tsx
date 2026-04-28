import React from 'react';
import type { Preview } from '@storybook/react'
import { Theme } from '@radix-ui/themes'
import '../src/styles/radix-themes.css'
// Side-effect import: assigns the singleton browser mock to globalThis so
// stories can call `browser.storage.local.set(...)` directly. The same mock
// is also returned to wxt/browser and @wxt-dev/browser via Vite aliases
// configured in main.ts, keeping every consumer on the same instance.
import './browser-mock';

interface LocalePlaceholder { content: string }
interface LocaleMessage { message: string; placeholders?: Record<string, LocalePlaceholder> }
type LocaleMessages = Record<string, LocaleMessage>;
type MessagesCache = Record<string, LocaleMessages>;
interface StorybookGlobals {
  messagesCache?: MessagesCache;
  currentLocale?: string;
}

const globals = globalThis as typeof globalThis & StorybookGlobals;
globals.messagesCache = globals.messagesCache ?? {};
const messagesCache = globals.messagesCache;

// Load every locale synchronously at module evaluation. Using fetch() inside
// a useEffect made the decorator render a "Loading translations..." skeleton
// for the first few microseconds of every story, racing against play()
// functions in the test-runner (which fires before postVisit). Eager glob
// bundles the JSON files directly so messagesCache is populated before any
// decorator runs.
const messageModules = import.meta.glob<LocaleMessages>(
  '../public/_locales/*/messages.json',
  { eager: true, import: 'default' },
);
for (const [path, messages] of Object.entries(messageModules)) {
  const match = path.match(/_locales\/([^/]+)\//);
  if (match) messagesCache[match[1]] = messages;
}

// Fonction pour détecter la langue du navigateur
function getBrowserLanguage(): string {
  const supported = ['en', 'fr', 'es'];
  const browserLang = navigator.language?.split('-')[0] || 'en';
  return supported.includes(browserLang) ? browserLang : 'en';
}

// Fonction pour détecter le thème du navigateur
function getBrowserTheme(): string {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

const defaultLocale = getBrowserLanguage();
const defaultTheme = getBrowserTheme();
globals.currentLocale = defaultLocale;

const preview: Preview = {
  initialGlobals: {
    locale: defaultLocale,
    theme: defaultTheme,
  },
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // axe-core configuration (shared with the Playwright helper in tests/e2e/helpers/a11y.ts).
    // Per-story overrides: set `parameters.a11y.config.rules = [{ id: 'rule-id', enabled: false }]`
    // and add a JSDoc-style comment explaining why the rule is disabled.
    a11y: {
      config: {
        // Page-level landmark rules: meaningful on a full document, never true on
        // an isolated component rendered in a Storybook iframe. They remain active
        // in the Playwright E2E audit (tests/e2e/helpers/a11y.ts) where the full
        // page layout is exercised.
        rules: [
          { id: 'region', enabled: false },
          { id: 'landmark-one-main', enabled: false },
          { id: 'page-has-heading-one', enabled: false },
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: defaultTheme,
      toolbar: {
        title: 'Theme',
        items: [
          { value: 'light', title: '☀️ Light' },
          { value: 'dark', title: '🌙 Dark' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Internationalization locale',
      defaultValue: defaultLocale,
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: [
          { value: 'en', title: '🌍 English' },
          { value: 'fr', title: '🥖 Français' },
          { value: 'es', title: '🌶️ Español' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // messagesCache is populated synchronously at module load (eager glob),
      // so we just sync the active locale and render. No skeleton, no race
      // with play() functions.
      globals.currentLocale = context.globals.locale ?? defaultLocale;

      // Wrap each story in a <main> landmark with a visually hidden <h1> so
      // page-level axe rules (region, landmark-one-main, page-has-heading-one)
      // pass on isolated components. Stories that render their own <main>
      // (full-page layouts) set parameters.landmark = false to skip the wrap.
      const wantsLandmark = context.parameters?.landmark !== false;
      const storyTitle = `${context.title}${context.name ? ` - ${context.name}` : ''}`;
      const visuallyHidden: React.CSSProperties = {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      };

      const content = <Story key={context.globals.locale} />;

      return (
        <Theme appearance={context.globals.theme || 'light'}>
          {wantsLandmark ? (
            <main style={{ padding: '20px', maxWidth: '400px' }}>
              <h1 style={visuallyHidden}>{storyTitle}</h1>
              {content}
            </main>
          ) : (
            <div style={{ padding: '20px', maxWidth: '400px' }}>{content}</div>
          )}
        </Theme>
      );
    },
  ],
};

export default preview;
