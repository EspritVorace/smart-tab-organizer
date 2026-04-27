import React from 'react';
import type { Preview } from '@storybook/react'
import { Theme } from '@radix-ui/themes'
import '../src/styles/radix-themes.css'

type LocalePlaceholder = { content: string };
type LocaleMessage = { message: string; placeholders?: Record<string, LocalePlaceholder> };
type LocaleMessages = Record<string, LocaleMessage>;
type MessagesCache = Record<string, LocaleMessages>;
interface MockBrowser {
  i18n: { getMessage: (key: string, substitutions?: string | string[]) => string };
}
interface StorybookGlobals {
  messagesCache?: MessagesCache;
  currentLocale?: string;
  browser?: MockBrowser;
}

const globals = globalThis as typeof globalThis & StorybookGlobals;
globals.messagesCache = globals.messagesCache ?? {};
const messagesCache = globals.messagesCache;

async function loadMessages(locale: string): Promise<LocaleMessages> {
  if (!messagesCache[locale]) {
    try {
      const response = await fetch(`/_locales/${locale}/messages.json`);
      messagesCache[locale] = await response.json();
    } catch (_error) {
      console.warn(`Could not load messages for locale ${locale}`);
      messagesCache[locale] = {};
    }
  }
  return messagesCache[locale];
}

function resolveMessage(entry: LocaleMessage, substitutions?: string | string[]): string {
  let msg = entry.message;
  if (entry.placeholders) {
    for (const [name, p] of Object.entries(entry.placeholders)) {
      msg = msg.split(`$${name}$`).join(p.content);
    }
  }
  if (substitutions !== undefined) {
    const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
    msg = msg.replace(/\$(\d+)/g, (m, n) => subs[Number(n) - 1] ?? m);
  }
  return msg;
}

const mockBrowser: MockBrowser = {
  i18n: {
    getMessage: (key: string, substitutions?: string | string[]) => {
      const locale = globals.currentLocale ?? 'en';
      const messages = messagesCache[locale] ?? {};
      const entry = messages[key];
      if (!entry) return key;
      return resolveMessage(entry, substitutions);
    }
  }
};

globals.browser = mockBrowser;

if (typeof window !== 'undefined') {
  (window as typeof window & { browser?: MockBrowser }).browser = mockBrowser;
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

// Précharger les messages pour la locale par défaut
const defaultLocale = getBrowserLanguage();
const defaultTheme = getBrowserTheme();
loadMessages(defaultLocale);

// La gestion du changement de locale se fait via le decorator

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
      const [messagesLoaded, setMessagesLoaded] = React.useState(false);
      
      React.useEffect(() => {
        if (context.globals.locale) {
          globals.currentLocale = context.globals.locale;
          setMessagesLoaded(false);
          loadMessages(context.globals.locale).then(() => {
            setMessagesLoaded(true);
          });
        }
      }, [context.globals.locale]);
      
      // Afficher un skeleton pendant le chargement des messages
      if (!messagesLoaded) {
        return (
          <Theme appearance={context.globals.theme || 'light'}>
            <div style={{ padding: '20px', maxWidth: '400px' }}>
              <div>Loading translations...</div>
            </div>
          </Theme>
        );
      }
      
      return (
        <Theme appearance={context.globals.theme || 'light'}>
          <div style={{ padding: '20px', maxWidth: '400px' }}>
            <Story key={context.globals.locale} />
          </div>
        </Theme>
      );
    },
  ],
};

export default preview;