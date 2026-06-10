// Generates `wxt-i18n-structure.d.ts` (the compile-time i18n key structure)
// from the English catalog `public/_locales/en/messages.json`, which is the
// reference locale (`default_locale: 'en'`).
//
// We deliberately stay on the verbose Chrome `_locales/{lang}/messages.json`
// format (issue #240) and only use `@wxt-dev/i18n/build` to derive the types;
// the runtime keeps reading `_locales` via `browser.i18n` under the hood. The
// generated file is committed and consumed by `src/utils/i18n.ts`
// (`MessageKey = keyof GeneratedI18nStructure`).
//
// Run manually with `pnpm i18n:types`; also invoked from a WXT hook in
// `wxt.config.ts` so a fresh `wxt prepare` keeps it in sync. The write is
// idempotent (only rewrites when the content changes) to avoid dirtying git.
import { parseMessagesFile, generateTypeText } from '@wxt-dev/i18n/build';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const enCatalog = resolve(root, 'public/_locales/en/messages.json');
const outFile = resolve(root, 'wxt-i18n-structure.d.ts');

export async function generateI18nTypes() {
  const messages = await parseMessagesFile(enCatalog);
  const contents = generateTypeText(messages);
  if (existsSync(outFile) && readFileSync(outFile, 'utf8') === contents) {
    return false; // up to date, nothing written
  }
  writeFileSync(outFile, contents, 'utf8');
  return true;
}

// Allow `node scripts/generate-i18n-types.mjs` as a standalone command.
if (import.meta.url === `file://${process.argv[1]}`) {
  const written = await generateI18nTypes();
  console.log(
    written
      ? '[i18n] wxt-i18n-structure.d.ts regenerated.'
      : '[i18n] wxt-i18n-structure.d.ts already up to date.',
  );
}
