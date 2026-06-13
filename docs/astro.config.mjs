import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://docs.esprit-vorace.fr',
  // 301 redirects (locale migration + legacy URLs) are served from
  // `public/_redirects` and enforced in `worker/index.ts`, not here.
  integrations: [
    starlight({
      title: 'SmartTab Organizer',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/global.css'],
      components: {
        // Inject schema.org JSON-LD structured data (GEO) on every page.
        Head: './src/components/Head.astro',
        // Append the official store badges below the splash hero actions.
        Hero: './src/components/Hero.astro',
      },
      defaultLocale: 'root',
      locales: {
        root: { label: 'English',  lang: 'en' },
        fr:   { label: 'Français', lang: 'fr' },
        es:   { label: 'Español',  lang: 'es' },
      },
      sidebar: [
        {
          label: 'Discover',
          translations: { fr: 'Découverte', es: 'Descubrir' },
          items: [
            { slug: 'discover/why' },
            { slug: 'discover/installation' },
            { slug: 'discover/interface-tour' },
            { slug: 'discover/home-page' },
          ],
        },
        {
          label: 'Guides',
          translations: { fr: 'Guides', es: 'Guías' },
          items: [
            { slug: 'guides/popup' },
            { slug: 'guides/group-tabs' },
            { slug: 'guides/domain-rules' },
            { slug: 'guides/deduplicate' },
            { slug: 'guides/sessions' },
            { slug: 'guides/workspaces' },
            { slug: 'guides/import-export' },
            { slug: 'guides/statistics' },
            { slug: 'guides/exploration' },
            { slug: 'guides/settings' },
            { slug: 'guides/help-and-documentation' },
          ],
        },
        {
          label: 'Reference',
          translations: { fr: 'Référence', es: 'Referencia' },
          items: [
            { slug: 'reference/keyboard-shortcuts' },
            { slug: 'reference/categories-and-packs' },
            { slug: 'reference/regex-presets' },
            { slug: 'reference/import-export-json-schema' },
            { slug: 'reference/open-source-licenses' },
          ],
        },
        {
          label: 'FAQ',
          items: [
            { slug: 'faq' },
          ],
        },
        {
          label: 'Contributing',
          translations: { fr: 'Contribuer', es: 'Contribuir' },
          items: [
            { slug: 'contributing/stack' },
            { slug: 'contributing/architecture' },
          ],
        },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/EspritVorace/smart-tab-organizer' },
      ],
    }),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
