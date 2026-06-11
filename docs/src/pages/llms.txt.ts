import type { APIRoute } from 'astro';
import { getEnglishDocs } from '../lib/docsMarkdown';

// Index llms.txt (https://llmstxt.org/), en anglais, pointant vers les
// versions Markdown de chaque page.

export const GET: APIRoute = async ({ site }) => {
  const docs = await getEnglishDocs();
  const base = (site?.toString() ?? 'https://docs.esprit-vorace.fr/').replace(/\/$/, '');

  const lines = [
    '# SmartTab Organizer',
    '',
    '> Browser extension (Chrome / Firefox) that groups your tabs by rules, removes duplicates, and saves your work sessions. Everything stays local, nothing goes online.',
    '',
    '## Documentation',
    '',
    ...docs.map(({ slug, entry }) => {
      const url = slug === 'index' ? `${base}/index.md` : `${base}/${slug}.md`;
      const desc = entry.data.description ? `: ${entry.data.description}` : '';
      return `- [${entry.data.title}](${url})${desc}`;
    }),
    '',
    '## Notes',
    '',
    '- Every page is also available as Markdown at its URL suffixed with `.md`, or via the `Accept: text/markdown` HTTP header.',
    '- The complete documentation is concatenated in [llms-full.txt](' + base + '/llms-full.txt).',
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
