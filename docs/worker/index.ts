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
// - Detection de langue : sur une vraie page HTML anglaise (racine), si le
//   visiteur n'a pas encore de cookie `docs_locale` et que son `Accept-Language`
//   prefere le francais ou l'espagnol, on le redirige (302) vers /fr/... ou
//   /es/.... Le cookie est pose des la premiere visite : ensuite plus aucune
//   redirection automatique, donc le selecteur de langue de Starlight n'est
//   jamais piege (un choix manuel d'anglais est respecte). Les regles 301 de
//   `_redirects` gardent la priorite sur cette detection.
// - Sinon : passe-plat vers les assets statiques (HTML, CSS, images...).
//
// `run_worker_first: true` (wrangler.jsonc) garantit que ce Worker s'execute
// meme pour les chemins correspondant a un asset, afin de lire `Accept`.

interface Env {
  ASSETS: Fetcher;
}

type Locale = 'fr' | 'es' | 'en';

const LOCALE_COOKIE = 'docs_locale';

/** Renvoie une reponse en s'assurant du content-type Markdown UTF-8. */
function asMarkdown(response: Response, negotiated = false): Response {
  const headers = new Headers(response.headers);
  headers.set('Content-Type', 'text/markdown; charset=utf-8');
  if (negotiated) headers.set('Vary', 'Accept');
  return new Response(response.body, { status: response.status, headers });
}

/** Locale portee par un pathname (prefixe /fr ou /es, sinon racine anglaise). */
function localeOf(pathname: string): Locale {
  if (/^\/fr(\/|$)/.test(pathname)) return 'fr';
  if (/^\/es(\/|$)/.test(pathname)) return 'es';
  return 'en';
}

/** Lit un cookie nomme dans l'entete `Cookie`. */
function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}

/** Cookie de memorisation de la locale (1 an, toutes les pages). */
function localeCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/**
 * Locale preferee parmi les locales supportees, d'apres `Accept-Language`.
 * Renvoie la premiere langue supportee par ordre de qualite decroissante ;
 * 'en' par defaut (langue racine et repli universel).
 */
function preferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return 'en';
  const ranked = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const q = qParam ? Number.parseFloat(qParam.split('=')[1]) : 1;
      return { base: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(q) ? q : 1 };
    })
    .filter((entry) => entry.base)
    .sort((a, b) => b.q - a.q);
  for (const { base } of ranked) {
    if (base === 'fr' || base === 'es' || base === 'en') return base;
  }
  return 'en';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const accept = request.headers.get('accept') ?? '';
    const lastSegment = url.pathname.split('/').pop() ?? '';
    const negotiatingMarkdown =
      accept.includes('text/markdown') && !lastSegment.includes('.');
    const isHtmlNav =
      request.method === 'GET' && accept.includes('text/html') && !lastSegment.includes('.');

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
    // mode `redirect: 'manual'` : les 301 de `public/_redirects` (migration des
    // slugs FR vers l'anglais, anciennes URLs heritees) sont propages
    // explicitement, meme si `run_worker_first` execute ce Worker avant le
    // routing d'assets.
    const assetResponse = await env.ASSETS.fetch(new Request(request, { redirect: 'manual' }));

    // Une regle _redirects (3xx) a precedence sur la detection de langue.
    if (assetResponse.status >= 300 && assetResponse.status < 400) {
      return assetResponse;
    }

    // Detection de langue : seulement sur une vraie page HTML, a la premiere
    // visite (aucun cookie `docs_locale`). Une fois le cookie pose, on ne
    // redirige plus jamais automatiquement (le selecteur de langue n'est donc
    // jamais piege).
    if (isHtmlNav && assetResponse.ok) {
      const cookieLocale = readCookie(request.headers.get('cookie'), LOCALE_COOKIE);
      if (!cookieLocale) {
        const pageLocale = localeOf(url.pathname);
        const preferred = preferredLocale(request.headers.get('accept-language'));
        if (pageLocale === 'en' && (preferred === 'fr' || preferred === 'es')) {
          return new Response(null, {
            status: 302,
            headers: {
              Location: `/${preferred}${url.pathname}${url.search}`,
              'Set-Cookie': localeCookie(preferred),
              'Cache-Control': 'no-store',
              Vary: 'Accept-Language, Cookie',
            },
          });
        }
        // Pas de redirection : on memorise la locale courante pour desactiver
        // toute redirection automatique lors des visites suivantes.
        const headers = new Headers(assetResponse.headers);
        headers.append('Set-Cookie', localeCookie(pageLocale));
        headers.set('Vary', 'Accept-Language, Cookie');
        return new Response(assetResponse.body, { status: assetResponse.status, headers });
      }
    }

    return assetResponse;
  },
} satisfies ExportedHandler<Env>;
