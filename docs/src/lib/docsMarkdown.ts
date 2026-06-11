import { getCollection, type CollectionEntry } from 'astro:content';

// Source unique pour les sorties Markdown destinees aux agents / LLM.
//
// Choix produit : le Markdown est servi *uniquement en anglais*, quelle que
// soit la locale de la page demandee (voir worker/index.ts pour la
// negociation). L'anglais etant desormais la locale racine, on ne garde que
// les entrees racine (sans prefixe `fr/` ni `es/`) : `index`, `guides/...`.

export interface EnglishDoc {
  /** Slug de sortie sous la racine du site : 'index', 'guides/deduplicate'... */
  slug: string;
  entry: CollectionEntry<'docs'>;
}

// Prefixe (ou id exact) des locales non racine : `fr`, `es`, `fr/...`, `es/...`.
const LOCALE_PREFIX = /^(fr|es)(\/|$)/;

/** Retourne les pages anglaises (racine), mappees vers leur slug de sortie. */
export async function getEnglishDocs(): Promise<EnglishDoc[]> {
  const docs = await getCollection('docs');
  return docs
    .filter((entry) => !LOCALE_PREFIX.test(entry.id))
    .map((entry) => ({
      // L'index racine porte l'id '' (ou 'index' selon Astro) : on le normalise.
      slug: entry.id === '' || entry.id === 'index' ? 'index' : entry.id,
      entry,
    }))
    .sort((a, b) => {
      // 'index' en premier, puis ordre alphabetique sur le slug.
      if (a.slug === 'index') return -1;
      if (b.slug === 'index') return 1;
      return a.slug.localeCompare(b.slug);
    });
}

/** Convertit une entree de doc en Markdown (corps source nettoye). */
export function entryToMarkdown(entry: CollectionEntry<'docs'>): string {
  const title = entry.data.title;
  const description = entry.data.description ?? '';

  // `entry.body` = source Markdown/MDX, frontmatter deja retire. On retire les
  // lignes d'import MDX et on normalise les sauts de ligne multiples. Les
  // balises de composants restent telles quelles (suffisant pour un agent, et
  // on evite d'abimer les blocs de code).
  const body = (entry.body ?? '')
    .replace(/^import\s.*?;?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `# ${title}\n\n${description ? `${description}\n\n` : ''}${body}\n`;
}
