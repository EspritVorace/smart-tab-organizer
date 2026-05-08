/**
 * Static HTTP server for the doc-scenarios mimetic sites.
 *
 * Serves the HTML files under `fixtures/sites/{host}/` based on the request's
 * `Host` header (or the path prefix when accessed via localhost). Combined
 * with Chromium's `--host-resolver-rules=MAP github.com:80 127.0.0.1:4173, ...`,
 * the URL bar shows real-looking domains while the actual response comes from
 * disk: deterministic and offline-safe.
 */
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SITES_PORT = 4173;

const SITES_ROOT = path.resolve(__dirname, 'sites');

const KNOWN_HOSTS = new Set(['github.com', 'youtube.com', 'google.com', 'lemonde.fr']);

/** Build the `--host-resolver-rules` value mapping every fictional host to the local server. */
export function getHostResolverRules(port: number = SITES_PORT): string {
  const rules = Array.from(KNOWN_HOSTS).map((host) => `MAP ${host}:80 127.0.0.1:${port}`);
  rules.push('EXCLUDE localhost');
  return rules.join(', ');
}

function resolveFile(reqHost: string, reqPath: string): string | null {
  const cleanPath = reqPath.split('?')[0].replace(/^\//, '') || 'index.html';

  // When the request comes from a host like `github.com`, look under sites/github.com/.
  if (KNOWN_HOSTS.has(reqHost)) {
    const candidate = path.join(SITES_ROOT, reqHost, cleanPath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    return null;
  }

  // Local development access: `http://localhost:4173/github.com/repo-readme.html`
  const candidate = path.join(SITES_ROOT, cleanPath);
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  return null;
}

export function startSitesServer(port: number = SITES_PORT): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const hostHeader = (req.headers.host ?? '').split(':')[0];
      const reqPath = req.url ?? '/';
      const filePath = resolveFile(hostHeader, reqPath);

      if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end(`Not found: ${hostHeader}${reqPath}`);
        return;
      }

      const body = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(body);
    });

    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

export function stopSitesServer(server: http.Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}
