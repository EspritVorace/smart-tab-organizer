import React from 'react';
import type { Preview } from '@storybook/react'
import { Theme } from '@radix-ui/themes'
import '../src/styles/radix-themes.css'

// Cache pour les messages (exposé globalement pour le mock)
(globalThis as any).messagesCache = {};
const messagesCache = (globalThis as any).messagesCache;

// Fonction pour charger les messages
async function loadMessages(locale: string) {
  if (!messagesCache[locale]) {
    try {
      const response = await fetch(`/_locales/${locale}/messages.json`);
      messagesCache[locale] = await response.json();
    } catch (error) {
      console.warn(`Could not load messages for locale ${locale}`);
      messagesCache[locale] = {};
    }
  }
  return messagesCache[locale];
}

// Mock pour le module wxt/browser
const mockBrowser = {
  i18n: {
    getMessage: (key: string) => {
      const locale = (global as any).currentLocale || 'en';
      const messages = messagesCache[locale] || {};
      return messages[key]?.message || key;
    }
  }
};

// Mock global pour wxt/browser
(global as any).browser = mockBrowser;

// Mock pour les imports ES6 de wxt/browser
if (typeof window !== 'undefined') {
  (window as any).browser = mockBrowser;
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
          (globalThis as any).currentLocale = context.globals.locale;
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