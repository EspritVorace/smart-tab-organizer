/// <reference types="@cloudflare/workers-types" />

// Negociation de contenu Markdown ("Markdown for Agents").
//
// Quand un client envoie `Accept: text/markdown`, on sert la version `.md`
// de la page (generee au build par src/pages/[...slug].md.ts) sur la meme
// URL. Sinon, passe-plat vers les assets statiques (HTML, CSS, images...).
//
// `run_worker_first: true` dans wrangler.jsonc garantit que ce Worker
// s'execute meme pour les chemins qui correspondent a un asset, afin de
// pouvoir inspecter l'en-tete `Accept` sur les pages HTML.

interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const accept = request.headers.get('accept') ?? '';
    const url = new URL(request.url);
    const lastSegment = url.pathname.split('/').pop() ?? '';

    // Passe-plat : pas de demande Markdown, ou requete vers un fichier
    // (extension dans le dernier segment : .css, .js, .png, .md deja...).
    if (!accept.includes('text/markdown') || lastSegment.includes('.')) {
      return env.ASSETS.fetch(request);
    }

    // Mapping page -> asset .md. Deux candidats couvrent les pages normales
    // et les racines (index / racines de locale).
    const base = url.pathname.replace(/\/$/, '');
    const candidates = [
      `${base}.md`, // /guides/dedupliquer/ -> /guides/dedupliquer.md
      `${base}/index.md`, // /en/ -> /en/index.md ; / -> /index.md
    ];

    for (const path of candidates) {
      const assetResponse = await env.ASSETS.fetch(new URL(path, url.origin));
      if (assetResponse.ok) {
        const headers = new Headers(assetResponse.headers);
        headers.set('Content-Type', 'text/markdown; charset=utf-8');
        headers.set('Vary', 'Accept');
        return new Response(assetResponse.body, {
          status: 200,
          headers,
        });
      }
    }

    // Aucun .md correspondant : on rend le HTML normal.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
