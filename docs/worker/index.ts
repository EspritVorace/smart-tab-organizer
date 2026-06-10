/// <reference types="@cloudflare/workers-types" />

// Negociation de contenu Markdown ("Markdown for Agents") + redirections 301.
//
// - Redirections : les regles de `public/_redirects` (migration des slugs FR
//   vers l'anglais, anciennes URLs heritees) sont appliquees par la couche
//   d'assets Cloudflare. Comme `run_worker_first: true` execute ce Worker
//   avant le routing d'assets, on appelle `env.ASSETS.fetch` en mode
//   `redirect: 'manual'` sur le chemin par defaut et on renvoie la reponse
//   telle quelle : les 301 sont ainsi propages explicitement au client.
// - Quand un client envoie `Accept: text/markdown`, on sert la version `.md`
//   de la page (generee au build par src/pages/[...slug].md.ts). Le Markdown
//   est *toujours en anglais* : on retire le prefixe de locale de l'URL avant
//   de chercher l'asset, donc /, /fr/... et /es/... renvoient la meme version
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
    const negotiatingMarkdown =
      accept.includes('text/markdown') && !lastSegment.includes('.');

    // Acces direct a un .md : on force le content-type Markdown UTF-8.
    if (lastSegment.endsWith('.md')) {
      return asMarkdown(await env.ASSETS.fetch(request));
    }

    // Negociation de contenu : sert le Markdown anglais sur la meme URL.
    // Traitee avant les redirections pour qu'une eventuelle canonicalisation
    // de slash final ne court-circuite pas la negociation.
    if (negotiatingMarkdown) {
      // Retire le prefixe de locale pour mapper vers le .md anglais (racine).
      const stripped = url.pathname.replace(/^\/(fr|es)(?=\/|$)/, '');
      const base = stripped.replace(/\/$/, '');
      const candidates = base === '' ? ['/index.md'] : [`${base}.md`, `${base}/index.md`];

      for (const path of candidates) {
        const assetResponse = await env.ASSETS.fetch(new URL(path, url.origin));
        if (assetResponse.ok) {
          return asMarkdown(assetResponse, true);
        }
      }
    }

    // Chemin par defaut (HTML / assets). On interroge la couche d'assets en
    // mode `redirect: 'manual'` et on renvoie la reponse telle quelle : les
    // 301 de `public/_redirects` (migration des slugs FR vers l'anglais,
    // anciennes URLs heritees) sont ainsi propages explicitement au client,
    // meme si `run_worker_first` execute ce Worker avant le routing d'assets.
    return env.ASSETS.fetch(new Request(request, { redirect: 'manual' }));
  },
} satisfies ExportedHandler<Env>;
