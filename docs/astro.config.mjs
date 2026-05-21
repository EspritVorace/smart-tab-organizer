import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [
    starlight({
      title: 'SmartTab Organizer',
      customCss: ['./src/styles/global.css'],
      defaultLocale: 'root',
      locales: {
        root: { label: 'Français', lang: 'fr' },
        en:   { label: 'English',  lang: 'en' },
        es:   { label: 'Español',  lang: 'es' },
      },
      sidebar: [
        {
          label: 'Introduction',
          translations: { en: 'Introduction', es: 'Introducción' },
          items: [
            { slug: 'introduction/pourquoi' },
          ],
        },
        {
          label: 'Concepts',
          translations: { en: 'Concepts', es: 'Conceptos' },
          items: [
            { slug: 'concepts/groupement' },
            { slug: 'concepts/deduplication' },
            { slug: 'concepts/sources-nom-groupe' },
            { slug: 'concepts/modes-nommage' },
            { slug: 'concepts/sessions-epinglees' },
            { slug: 'concepts/packs' },
            { slug: 'concepts/workspaces' },
          ],
        },
        {
          label: 'Démarrage',
          translations: { en: 'Getting Started', es: 'Primeros pasos' },
          items: [
            { slug: 'demarrage/installation' },
            { slug: 'demarrage/tour-interface' },
            { slug: 'demarrage/page-accueil' },
          ],
        },
        {
          label: 'Fonctionnalités',
          translations: { en: 'Features', es: 'Características' },
          items: [
            { slug: 'fonctionnalites/popup' },
            {
              label: 'Règles de domaine',
              translations: { en: 'Domain Rules', es: 'Reglas de dominio' },
              items: [
                { slug: 'fonctionnalites/regles/vue-ensemble' },
                { slug: 'fonctionnalites/regles/creer-une-regle' },
                { slug: 'fonctionnalites/regles/modifier-supprimer' },
                { slug: 'fonctionnalites/regles/packs' },
                { slug: 'fonctionnalites/regles/presets-regex' },
              ],
            },
            {
              label: 'Sessions',
              items: [
                { slug: 'fonctionnalites/sessions/vue-ensemble' },
                { slug: 'fonctionnalites/sessions/capturer-instantane' },
                { slug: 'fonctionnalites/sessions/restaurer-session' },
                { slug: 'fonctionnalites/sessions/editer-session' },
                { slug: 'fonctionnalites/sessions/sessions-epinglees' },
              ],
            },
            {
              label: 'Espaces de travail',
              translations: { en: 'Workspaces', es: 'Espacios de trabajo' },
              items: [
                { slug: 'fonctionnalites/workspaces/vue-ensemble' },
                { slug: 'fonctionnalites/workspaces/gerer-workspaces' },
                { slug: 'fonctionnalites/workspaces/changer-workspace-actif' },
                { slug: 'fonctionnalites/workspaces/profils-popup' },
              ],
            },
            {
              label: 'Import / Export',
              items: [
                { slug: 'fonctionnalites/import-export/exporter-regles' },
                { slug: 'fonctionnalites/import-export/importer-regles' },
                { slug: 'fonctionnalites/import-export/exporter-sessions' },
                { slug: 'fonctionnalites/import-export/importer-sessions' },
                { slug: 'fonctionnalites/import-export/exporter-workspace' },
                { slug: 'fonctionnalites/import-export/importer-workspace' },
              ],
            },
            { slug: 'fonctionnalites/statistiques' },
            { slug: 'fonctionnalites/parametres' },
          ],
        },
        {
          label: 'FAQ',
          items: [
            { slug: 'faq' },
          ],
        },
        {
          label: 'Annexes',
          translations: { en: 'Reference', es: 'Referencia' },
          items: [
            { slug: 'annexes/packs-integres' },
            { slug: 'annexes/presets-regex' },
            { slug: 'annexes/raccourcis-clavier' },
            { slug: 'annexes/stack-technique' },
          ],
        },
      ],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/EspritVorace/smart-tab-organizer' },
      ],
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
