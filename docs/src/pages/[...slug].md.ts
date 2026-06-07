import { getCollection, type CollectionEntry } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';

// Sert une version Markdown brute de chaque page de doc, accessible a
// `<url>.md` (ex. /guides/dedupliquer.md). Combine au Worker de negociation
// (worker/index.ts), cela permet de repondre en Markdown quand un client
// envoie `Accept: text/markdown` ("Markdown for Agents" de Cloudflare).
//
// Les ids de la collection `docs` incluent le prefixe de locale, donc les
// trois langues (root/fr, en, es) sont couvertes automatiquement.

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getCollection('docs');
  return docs.map((entry) => ({
    params: { slug: entry.id },
    props: { entry },
  }));
};

interface Props {
  entry: CollectionEntry<'docs'>;
}

export const GET: APIRoute<Props> = ({ props }) => {
  const { entry } = props;
  const title = entry.data.title;
  const description = entry.data.description ?? '';

  // `entry.body` = source Markdown/MDX, frontmatter deja retire.
  // On nettoie les lignes d'import MDX et les sauts de ligne multiples.
  const body = (entry.body ?? '')
    .replace(/^import\s.*?;?\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const markdown = `# ${title}\n\n${description ? `${description}\n\n` : ''}${body}\n`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
