import { getCollection, type CollectionEntry } from 'astro:content';

// Source unique pour les sorties Markdown destinees aux agents / LLM.
//
// Choix produit : le Markdown est servi *uniquement en anglais*, quelle que
// soit la locale de la page demandee (voir worker/index.ts pour la
// negociation). On ne genere donc que les entrees anglaises, exposees aux
// chemins racine (sans prefixe de locale) : `index`, `guides/...`, etc.

export interface EnglishDoc {
  /** Slug de sortie sous la racine du site : 'index', 'guides/dedupliquer'... */
  slug: string;
  entry: CollectionEntry<'docs'>;
}

const EN_PREFIX = 'en/';

/** Retourne les pages anglaises, mappees vers leur slug de sortie sans prefixe. */
export async function getEnglishDocs(): Promise<EnglishDoc[]> {
  const docs = await getCollection('docs');
  return docs
    .filter((entry) => entry.id === 'en' || entry.id.startsWith(EN_PREFIX))
    .map((entry) => ({
      slug: entry.id === 'en' ? 'index' : entry.id.slice(EN_PREFIX.length),
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
