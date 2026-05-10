/**
 * Strips diacritics and lowercases the input. Enables case- and
 * accent-insensitive comparison: "etude" finds "étude", "règle" finds "regle".
 *
 * Uses NFD decomposition (each precomposed character becomes base +
 * combining mark) followed by removal of the combining diacritic marks.
 * The resulting indices align with the original NFC text, because each
 * precomposed NFC character produces exactly one character after
 * normalization.
 */
export function foldAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
