import type { APIRoute, GetStaticPaths } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { getEnglishDocs, entryToMarkdown } from '../lib/docsMarkdown';

// Sert la version Markdown (anglaise) de chaque page de doc, accessible a
// `<url>.md` (ex. /guides/dedupliquer.md). Combine au Worker de negociation
// (worker/index.ts), cela permet de repondre en Markdown quand un client
// envoie `Accept: text/markdown` ("Markdown for Agents" de Cloudflare).

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = await getEnglishDocs();
  return docs.map(({ slug, entry }) => ({
    params: { slug },
    props: { entry },
  }));
};

interface Props {
  entry: CollectionEntry<'docs'>;
}

export const GET: APIRoute<Props> = ({ props }) => {
  return new Response(entryToMarkdown(props.entry), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
    },
  });
};
