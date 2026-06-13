import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';

/**
 * Dependency-free remark plugin adding support for explicit, locale-stable
 * heading ids via the `## Heading {#my-id}` syntax. Astro derives heading ids
 * from the heading TEXT (github-slugger), which differs per locale; an explicit
 * id lets the extension's exploration catalogue deep-link to the same section
 * across EN/FR/ES. The id we set on `data.hProperties` is preserved by Astro's
 * own heading-id pass (it only fills ids that are still missing).
 */
function remarkHeadingIds() {
  const ID_AT_END = /\s*\{#([A-Za-z0-9_-]+)\}\s*$/;
  const walk = (node) => {
    if (node.type === 'heading' && Array.isArray(node.children) && node.children.length) {
      const last = node.children[node.children.length - 1];
      if (last && last.type === 'text') {
        const match = last.value.match(ID_AT_END);
        if (match) {
          last.value = last.value.slice(0, last.value.length - match[0].length);
          node.data = node.data || {};
          node.data.id = match[1];
          node.data.hProperties = { ...(node.data.hProperties || {}), id: match[1] };
        }
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://docs.esprit-vorace.fr',
  markdown: {
    remarkPlugins: [remarkHeadingIds],
  },
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
