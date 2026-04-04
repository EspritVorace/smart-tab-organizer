# User Stories — Domaine PO : Sauvegarde d'un groupe d'onglets actif

> Comportements couverts par `tests/e2e/popup.spec.ts` et `tests/tabCapture.test.ts`.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-PO006.

---

## US-PO006 — Transformation du bouton Save en SplitButton quand l'onglet actif est dans un groupe

**En tant qu'** utilisateur dont l'onglet actif appartient à un groupe Chrome,
**je veux** que le bouton « Save » du popup se transforme en SplitButton (bouton principal + flèche déroulante),
**afin de** pouvoir choisir entre sauvegarder tous les onglets ou uniquement le groupe actif.

### Critères d'acceptation

- [ ] Quand l'onglet actif **n'appartient pas** à un groupe Chrome, le bouton Save s'affiche comme un bouton simple (icône appareil photo + texte « Save »), comportement inchangé.
- [ ] Quand l'onglet actif **appartient à un groupe** Chrome, le bouton Save se transforme en SplitButton : la partie principale (icône + texte) reste identique visuellement, et une petite flèche (chevron) est ajoutée à sa droite.
- [ ] Cliquer sur la **partie principale** du SplitButton (icône + texte) déclenche le comportement actuel : ouverture du SnapshotWizard avec tous les onglets pré-cochés.
- [ ] Cliquer sur la **flèche** du SplitButton ouvre un menu déroulant avec deux options :
  - « Save active tab group »
  - « Save all tabs »
- [ ] L'option « Save all tabs » du menu déclenche le même comportement que le clic sur la partie principale.
- [ ] Quand le bouton est désactivé (`canSave = false`), ni la partie principale ni la flèche ne sont actives.

---

## US-PO007 — Sauvegarde du groupe d'onglets actif

**En tant qu'** utilisateur dont l'onglet actif appartient à un groupe Chrome,
**je veux** pouvoir sauvegarder uniquement ce groupe d'onglets via l'option « Save active tab group »,
**afin de** créer rapidement une session dédiée au groupe sans avoir à désélectionner manuellement les autres onglets.

### Critères d'acceptation

- [ ] Sélectionner « Save active tab group » dans le menu ouvre le SnapshotWizard (dialogue « Save Session Snapshot »).
- [ ] Le SnapshotWizard s'ouvre avec **uniquement les onglets du groupe actif pré-cochés** ; les autres onglets (hors groupe ou d'autres groupes) ne sont pas cochés.
- [ ] La pré-sélection est **modifiable** : l'utilisateur peut cocher/décocher librement des onglets.
- [ ] Le **nom de session par défaut** est le titre du groupe Chrome (ex : « Travail »).
- [ ] Si le groupe **n'a pas de titre** (groupe sans nom), le nom par défaut est « Snapshot \<date\> » (comportement habituel).
- [ ] Le deep link `options.html#sessions?action=snapshot&groupId=<id>` ouvre le SnapshotWizard avec la pré-sélection et le nom du groupe correspondant.
- [ ] Si le `groupId` passé en paramètre ne correspond à aucun groupe capturé (groupe entre-temps supprimé), le SnapshotWizard s'ouvre avec tous les onglets pré-cochés (fallback habituel).

### Règles métier

| Situation | Nom de session par défaut | Onglets pré-cochés |
|---|---|---|
| Groupe avec titre | Titre du groupe | Onglets du groupe uniquement |
| Groupe sans titre | « Snapshot \<date\> » | Onglets du groupe uniquement |
| `groupId` inconnu au moment de la capture | « Snapshot \<date\> » | Tous les onglets |
