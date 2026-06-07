/// <reference types="@cloudflare/workers-types" />

// Negociation de contenu Markdown ("Markdown for Agents").
//
// - Quand un client envoie `Accept: text/markdown`, on sert la version `.md`
//   de la page (generee au build par src/pages/[...slug].md.ts). Le Markdown
//   est *toujours en anglais* : on retire le prefixe de locale de l'URL avant
//   de chercher l'asset, donc /, /en/... et /es/... renvoient la meme version
//   anglaise.
// - Tout `.md` est servi en `text/markdown; charset=utf-8` (les accents des
//   contenus FR/ES cites restent correctement encodes, pas de mojibake).
// - Sinon : passe-plat vers les assets statiques (HTML, CSS, images...).
//
// `run_worker_first: true` (wrangler.jsonc) garantit que ce Worker s'execute
// meme pour les chemins correspondant a un asset, afin de lire `Accept`.

interface Env {
  ASSETS: Fetcher;
}

/** Renvoie une reponse en s'assurant du content-type Markdown UTF-8. */
function asMarkdown(response: Response, negotiated = false): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  if (negotiated) headers.set('Vary', 'Accept');
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const accept = request.headers.get('accept') ?? '';
    const lastSegment = url.pathname.split('/').pop() ?? '';

    // Acces direct a un .md : on force le content-type Markdown UTF-8.
    if (lastSegment.endsWith('.md')) {
      return asMarkdown(await env.ASSETS.fetch(request));
    }

    // Negociation de contenu : sert le Markdown anglais sur la meme URL.
    if (accept.includes('text/markdown') && !lastSegment.includes('.')) {
      // Retire le prefixe de locale pour mapper vers le .md anglais (racine).
      const stripped = url.pathname.replace(/^\/(en|es)(?=\/|$)/, '');
      const base = stripped.replace(/\/$/, '');
      const candidates = base === '' ? ['/index.md'] : [`${base}.md`, `${base}/index.md`];

      for (const path of candidates) {
        const assetResponse = await env.ASSETS.fetch(new URL(path, url.origin));
        if (assetResponse.ok) {
          return asMarkdown(assetResponse, true);
        }
      }
    }

    // Aucun Markdown a servir : on rend l'asset normal (HTML, etc.).
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
