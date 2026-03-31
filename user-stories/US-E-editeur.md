# User Stories — Domaine E : Éditeur de session (compléments)

> Comportements testés dans `tests/e2e/session-editor.spec.ts` non couverts par les US-E001→E002 existantes.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-E003.

---

## US-E003 — Résumé onglets/groupes dans l'en-tête de l'éditeur

**En tant qu'** utilisateur ouvrant l'éditeur d'une session,
**je veux** voir un résumé du nombre d'onglets et de groupes contenu dans la session,
**afin de** connaître la taille de la session avant de la modifier.

### Critères d'acceptation

- [ ] Le dialogue de l'éditeur affiche le nombre total d'onglets de la session (ex. « 3 tabs »).
- [ ] Le dialogue affiche le nombre de groupes d'onglets (ex. « 1 group »).
- [ ] Ces informations sont scoppées au dialogue et ne proviennent pas de la carte de session visible en arrière-plan.

---

## US-E004 — Arborescence des onglets dans l'éditeur

**En tant qu'** utilisateur,
**je veux** voir la liste des onglets de la session organisée dans l'éditeur,
**afin de** visualiser et gérer le contenu de la session avant de la sauvegarder.

### Critères d'acceptation

- [ ] L'éditeur affiche les onglets de la session avec leur titre.
- [ ] Les onglets appartenant à un groupe sont affichés sous leur groupe respectif.
- [ ] Les onglets non groupés sont visibles dans la section des onglets libres.

---

## US-E005 — Garde contre les modifications non sauvegardées

**En tant qu'** utilisateur,
**je veux** être averti si je tente de fermer l'éditeur avec des modifications non sauvegardées,
**afin de** ne pas perdre accidentellement mes changements.

### Critères d'acceptation

- [ ] Cliquer « Cancel » **sans** avoir effectué de modification ferme le dialogue immédiatement, sans alerte.
- [ ] Cliquer « Cancel » **après** avoir modifié au moins un champ (ex. le nom de la session) affiche une boîte de dialogue d'alerte (`alertdialog`) contenant le mot « unsaved ».
- [ ] Le bouton « Leave » dans l'alerte ferme le dialogue d'édition sans sauvegarder, et la session conserve son nom d'origine.
- [ ] Après avoir cliqué « Leave », aucun dialogue n'est plus visible et le nom original de la session est visible dans la liste.
