import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://docs.esprit-vorace.fr',
  redirects: {
    '/introduction/pourquoi': '/decouverte/pourquoi',
    '/demarrage/installation': '/decouverte/installation',
    '/demarrage/tour-interface': '/decouverte/tour-interface',
    '/demarrage/page-accueil': '/decouverte/page-accueil',
    '/concepts/groupement': '/guides/grouper-onglets',
    '/concepts/sources-nom-groupe': '/guides/grouper-onglets',
    '/concepts/modes-nommage': '/guides/grouper-onglets',
    '/concepts/deduplication': '/guides/dedupliquer',
    '/concepts/sessions-epinglees': '/guides/sessions',
    '/concepts/packs': '/reference/categories-et-packs',
    '/concepts/workspaces': '/guides/workspaces',
    '/fonctionnalites/popup': '/guides/popup',
    '/fonctionnalites/regles/vue-ensemble': '/guides/regles-de-domaine',
    '/fonctionnalites/regles/creer-une-regle': '/guides/regles-de-domaine',
    '/fonctionnalites/regles/modifier-supprimer': '/guides/regles-de-domaine',
    '/fonctionnalites/regles/packs': '/reference/categories-et-packs',
    '/fonctionnalites/regles/presets-regex': '/reference/presets-regex',
    '/fonctionnalites/sessions/vue-ensemble': '/guides/sessions',
    '/fonctionnalites/sessions/capturer-instantane': '/guides/sessions',
    '/fonctionnalites/sessions/restaurer-session': '/guides/sessions',
    '/fonctionnalites/sessions/editer-session': '/guides/sessions',
    '/fonctionnalites/sessions/sessions-epinglees': '/guides/sessions',
    '/fonctionnalites/workspaces/vue-ensemble': '/guides/workspaces',
    '/fonctionnalites/workspaces/gerer-workspaces': '/guides/workspaces',
    '/fonctionnalites/workspaces/changer-workspace-actif': '/guides/workspaces',
    '/fonctionnalites/workspaces/profils-popup': '/guides/workspaces',
    '/fonctionnalites/import-export/exporter-regles': '/guides/import-export',
    '/fonctionnalites/import-export/importer-regles': '/guides/import-export',
    '/fonctionnalites/import-export/exporter-sessions': '/guides/import-export',
    '/fonctionnalites/import-export/importer-sessions': '/guides/import-export',
    '/fonctionnalites/import-export/exporter-workspace': '/guides/import-export',
    '/fonctionnalites/import-export/importer-workspace': '/guides/import-export',
    '/fonctionnalites/statistiques': '/guides/statistiques',
    '/fonctionnalites/parametres': '/guides/parametres',
    '/annexes/packs-integres': '/reference/categories-et-packs',
    '/annexes/presets-regex': '/reference/presets-regex',
    '/annexes/raccourcis-clavier': '/reference/raccourcis-clavier',
    '/annexes/stack-technique': '/contribuer/stack',
  },
  integrations: [
    starlight({
      title: 'SmartTab Organizer',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/global.css'],
      defaultLocale: 'root',
      locales: {
        root: { label: 'Français', lang: 'fr' },
        en:   { label: 'English',  lang: 'en' },
        es:   { label: 'Español',  lang: 'es' },
      },
      sidebar: [
        {
          label: 'Découverte',
          translations: { en: 'Discover', es: 'Descubrir' },
          items: [
            { slug: 'decouverte/pourquoi' },
            { slug: 'decouverte/installation' },
            { slug: 'decouverte/tour-interface' },
            { slug: 'decouverte/page-accueil' },
          ],
        },
        {
          label: 'Guides',
          translations: { en: 'Guides', es: 'Guías' },
          items: [
            { slug: 'guides/popup' },
            { slug: 'guides/grouper-onglets' },
            { slug: 'guides/regles-de-domaine' },
            { slug: 'guides/dedupliquer' },
            { slug: 'guides/sessions' },
            { slug: 'guides/workspaces' },
            { slug: 'guides/import-export' },
            { slug: 'guides/statistiques' },
            { slug: 'guides/parametres' },
          ],
        },
        {
          label: 'Référence',
          translations: { en: 'Reference', es: 'Referencia' },
          items: [
            { slug: 'reference/raccourcis-clavier' },
            { slug: 'reference/categories-et-packs' },
            { slug: 'reference/presets-regex' },
            { slug: 'reference/licences-open-source' },
          ],
        },
        {
          label: 'FAQ',
          items: [
            { slug: 'faq' },
          ],
        },
        {
          label: 'Contribuer',
          translations: { en: 'Contributing', es: 'Contribuir' },
          items: [
            { slug: 'contribuer/stack' },
            { slug: 'contribuer/architecture' },
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
