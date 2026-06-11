/**
 * Node ESM resolution hook letting `scripts/generate-json-schema-doc.mjs`
 * import the project's Zod schema chain (`src/utils/importJsonSchemas.ts`)
 * outside the browser. It:
 *
 *   1. maps `@/utils/i18n` to a browser-free identity stub, so loading the
 *      schemas does not pull in `wxt/browser`;
 *   2. maps the remaining `@/*` alias to `src/*` (resolving to `.ts`);
 *   3. rewrites relative `.js` specifiers to their sibling `.ts` source.
 *
 * Run via:
 *   node --experimental-strip-types --loader ./scripts/json-schema-doc/loader.mjs ...
 */
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const SRC = join(ROOT, 'src');
const I18N_STUB = pathToFileURL(join(HERE, 'i18n-stub.mjs')).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@/utils/i18n' || specifier === '@/utils/i18n.js') {
    return { url: I18N_STUB, shortCircuit: true };
  }

  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2).replace(/\.js$/, '');
    return { url: pathToFileURL(join(SRC, `${rel}.ts`)).href, shortCircuit: true };
  }

  if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    specifier.endsWith('.js') &&
    context.parentURL
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const tsPath = join(parentDir, specifier.replace(/\.js$/, '.ts'));
    if (existsSync(tsPath)) {
      return { url: pathToFileURL(tsPath).href, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
