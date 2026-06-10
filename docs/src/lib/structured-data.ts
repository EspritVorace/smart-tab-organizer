// Helpers for the schema.org JSON-LD emitted by `components/Head.astro`.
//
// The structured data targets GEO (Generative Engine Optimization): it
// describes the product entity (SoftwareApplication), reinforces the site
// (WebSite / Organization) and exposes machine-readable Q&A (FAQPage) and
// article (TechArticle) nodes so search engines and LLMs can ingest the
// documentation reliably.
//
// All locale-sensitive copy lives here so the .astro component stays thin
// and the markdown parser can be reasoned about in isolation.

export type DocLocale = 'fr' | 'en' | 'es';

/** Public product name, identical across locales. */
export const APP_NAME = 'SmartTab Organizer';

/** Concise product description used on the SoftwareApplication node. */
export const appDescription: Record<DocLocale, string> = {
  fr: "Extension de navigateur (Chrome et Firefox) qui groupe automatiquement les onglets par règles de domaine, supprime les doublons et sauvegarde vos sessions de travail. Tout reste local, aucune donnée n'est envoyée en ligne.",
  en: 'Browser extension (Chrome and Firefox) that automatically groups tabs with domain rules, removes duplicates and saves your work sessions. Everything stays local, no data is sent online.',
  es: 'Extensión de navegador (Chrome y Firefox) que agrupa automáticamente las pestañas mediante reglas de dominio, elimina los duplicados y guarda tus sesiones de trabajo. Todo permanece local, no se envía ningún dato en línea.',
};

/** Feature bullet points surfaced on the SoftwareApplication node. */
export const featureList: Record<DocLocale, string[]> = {
  fr: [
    'Groupement automatique des onglets par règles de domaine',
    'Déduplication des onglets en double',
    'Sessions de travail et profils épinglés',
    'Workspaces multiples',
    'Import et export des règles et sessions (JSON)',
    'Statistiques de groupement et de déduplication',
    'Presets regex et packs de règles intégrés',
    'Fonctionnement 100% local, sans requête réseau',
  ],
  en: [
    'Automatic tab grouping with domain rules',
    'Deduplication of duplicate tabs',
    'Work sessions and pinned profiles',
    'Multiple workspaces',
    'Import and export of rules and sessions (JSON)',
    'Grouping and deduplication statistics',
    'Built-in regex presets and rule packs',
    'Fully local, no network requests',
  ],
  es: [
    'Agrupación automática de pestañas mediante reglas de dominio',
    'Deduplicación de pestañas duplicadas',
    'Sesiones de trabajo y perfiles fijados',
    'Múltiples workspaces',
    'Importación y exportación de reglas y sesiones (JSON)',
    'Estadísticas de agrupación y deduplicación',
    'Presets regex y packs de reglas integrados',
    'Funcionamiento 100% local, sin peticiones de red',
  ],
};

/** Label of the breadcrumb root ("Home") per locale. */
export const homeLabel: Record<DocLocale, string> = {
  fr: 'Accueil',
  en: 'Home',
  es: 'Inicio',
};

/**
 * Localized names for the first path segment, mirroring the Starlight
 * sidebar group labels. Used to build the intermediate breadcrumb crumb.
 */
export const sectionLabels: Record<string, Record<DocLocale, string>> = {
  discover: { fr: 'Découverte', en: 'Discover', es: 'Descubrir' },
  guides: { fr: 'Guides', en: 'Guides', es: 'Guías' },
  reference: { fr: 'Référence', en: 'Reference', es: 'Referencia' },
  contributing: { fr: 'Contribuer', en: 'Contributing', es: 'Contribuir' },
  faq: { fr: 'FAQ', en: 'FAQ', es: 'FAQ' },
};

/** A single breadcrumb entry. `item` (URL) is omitted for non-linked crumbs. */
export interface Crumb {
  name: string;
  item?: string;
}

/** Build a schema.org BreadcrumbList node, numbering positions from 1. */
export function breadcrumbList(id: string, crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    '@id': id,
    itemListElement: crumbs.map((crumb, index) => {
      const node: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
      };
      if (crumb.item) node.item = crumb.item;
      return node;
    }),
  };
}

/**
 * Serialize a JSON-LD object for safe embedding inside a `<script>` element.
 *
 * `JSON.stringify` does not escape `<`, `>` or `&`, so a literal `</script>`
 * (or `<!--`) in any string value could otherwise terminate the script tag
 * and inject markup. Escaping these characters as `\uXXXX` keeps the JSON
 * valid (parsers decode the escapes) while neutralizing any breakout.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(
    /[<>&\u2028\u2029]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
  );
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Strip inline markdown so a fragment becomes plain text for JSON-LD. */
function stripMarkdown(md: string): string {
  return (
    md
      // images: ![alt](url)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // links: [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // bold: **text** / __text__ -> text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // inline code: `text` -> text
      .replace(/`([^`]+)`/g, '$1')
      // leftover heading markers
      .replace(/^#{1,6}\s+/gm, '')
      // collapse all whitespace runs into single spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Parse the raw markdown body of an FAQ page into question/answer pairs.
 *
 * Each `## Heading` becomes a question and the prose below it (until the
 * next `##`) becomes the answer. `import` statements and JSX/HTML tags are
 * removed first, which collapses the trailing "next steps" card grid into
 * an empty answer that is then skipped.
 */
export function parseFaq(body: string): FaqItem[] {
  let cleaned = body.replace(/^import[^\n]*$/gm, ''); // ESM import lines
  // Strip JSX / HTML tags. Repeat until the string is stable so that
  // overlapping or nested angle-bracket sequences cannot survive a single
  // pass (a one-shot replace is bypassable, e.g. `<<tag>tag>`).
  let previous: string;
  do {
    previous = cleaned;
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  } while (cleaned !== previous);

  const items: FaqItem[] = [];
  const sections = cleaned.split(/^##\s+/m).slice(1); // drop pre-heading intro
  for (const section of sections) {
    const newline = section.indexOf('\n');
    const rawQuestion = newline === -1 ? section : section.slice(0, newline);
    const rawAnswer = newline === -1 ? '' : section.slice(newline + 1);
    const question = stripMarkdown(rawQuestion);
    const answer = stripMarkdown(rawAnswer);
    // Skip navigation-only or empty sections (e.g. the card-grid footer).
    if (!question || answer.length < 2) continue;
    items.push({ question, answer });
  }
  return items;
}
