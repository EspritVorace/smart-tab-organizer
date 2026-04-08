import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'SmartTab Organizer',
      defaultLocale: 'root',
      locales: {
        root: { label: 'Français', lang: 'fr' },
        en:   { label: 'English',  lang: 'en' },
        es:   { label: 'Español',  lang: 'es' },
      },
      sidebar: [
        {
          label: 'Fonctionnalités',
          translations: { en: 'Features', es: 'Características' },
          autogenerate: { directory: 'fonctionnalites' },
        },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/EspritVorace/smart-tab-organizer' },
      ],
    }),
  ],
});
