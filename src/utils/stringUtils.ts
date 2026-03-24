/**
 * Supprime les diacritiques et met en minuscules.
 * Permet une comparaison insensible à la casse ET aux accents :
 * "etude" trouve "étude", "règle" trouve "regle".
 *
 * Fonctionne par décomposition NFD (chaque caractère précomposé devient
 * base + marque combinante) puis suppression des marques diacritiques.
 * Les indices du résultat correspondent à ceux du texte NFC d'origine,
 * car chaque caractère NFC précomposé produit exactement un caractère
 * après normalisation.
 */
export function foldAccents(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
