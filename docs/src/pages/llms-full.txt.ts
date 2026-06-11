import type { APIRoute } from 'astro';
import { getEnglishDocs, entryToMarkdown } from '../lib/docsMarkdown';

// Documentation complete concatenee (anglais), pour ingestion par un LLM.

export const GET: APIRoute = async () => {
  const docs = await getEnglishDocs();
  const content = docs.map(({ entry }) => entryToMarkdown(entry)).join('\n\n');

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
