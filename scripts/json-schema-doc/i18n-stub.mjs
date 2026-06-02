/**
 * Identity stub for `@/utils/i18n`, used only by the JSON-schema doc
 * generator (run outside the browser). Returning the key verbatim makes
 * every documented schema property carry `description === <i18n key>`,
 * which the generator then resolves per locale from `public/_locales`.
 */
export function getMessage(key) {
  return key;
}

export function getPluralMessage(_count, oneKey) {
  return oneKey;
}
