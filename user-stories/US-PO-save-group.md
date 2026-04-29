# User Stories : Domaine PO : Sauvegarde d'un groupe d'onglets actif

> Comportements couverts par `tests/e2e/popup-save-group.spec.ts` et `tests/tabCapture.test.ts`.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-PO006.

---

## US-PO006 : Bouton Save contextuel dans le popup

**En tant qu'** utilisateur du popup,
**je veux** un bouton Save unique dont l'action s'adapte au contexte de l'onglet actif,
**afin de** sauvegarder en un clic la portée la plus pertinente sans avoir à choisir dans un menu.

### Critères d'acceptation

- [ ] Le bouton Save reste un bouton simple (icône appareil photo + texte « Save ») dans tous les cas : aucun chevron, aucun menu déroulant, aucun SplitButton.
- [ ] Quand l'onglet actif **n'appartient pas** à un groupe Chrome, cliquer sur Save ouvre le SnapshotWizard avec tous les onglets de la fenêtre pré-cochés (deep link `#sessions?action=snapshot`).
- [ ] Quand l'onglet actif **appartient à un groupe** Chrome, cliquer sur Save ouvre le SnapshotWizard avec uniquement les onglets de ce groupe pré-cochés (deep link `#sessions?action=snapshot&groupId=<id>`).
- [ ] Quand le bouton est désactivé (`canSave = false`), aucun clic ne déclenche d'action.
- [ ] Le `aria-label` reflète l'action contextuelle :
  - hors groupe : « Save session » (clé `popupSaveSession`),
  - dans un groupe : « Save active tab group » (clé `popupSaveActiveGroup`).

---

## US-PO007 : Sauvegarde du groupe d'onglets actif

**En tant qu'** utilisateur dont l'onglet actif appartient à un groupe Chrome,
**je veux** que le bouton Save sauvegarde uniquement ce groupe et m'informe de cette restriction modifiable,
**afin de** créer rapidement une session dédiée sans craindre une sélection incomplète subie.

### Critères d'acceptation

- [ ] Le clic sur Save (ou l'ouverture directe du deep link `#sessions?action=snapshot&groupId=<id>`) ouvre le SnapshotWizard.
- [ ] Le SnapshotWizard s'ouvre avec **uniquement les onglets du groupe actif pré-cochés** ; les autres onglets (hors groupe ou d'autres groupes) ne sont pas cochés.
- [ ] La pré-sélection est **modifiable** : l'utilisateur peut cocher ou décocher librement n'importe quel onglet.
- [ ] Le **nom de session par défaut** est le titre du groupe Chrome (ex : « Travail »).
- [ ] Si le groupe **n'a pas de titre** (groupe sans nom), le nom par défaut est « Snapshot \<date\> » (comportement habituel).
- [ ] Si le `groupId` passé en paramètre ne correspond à aucun groupe capturé (groupe entre-temps supprimé), le SnapshotWizard s'ouvre avec tous les onglets pré-cochés (fallback habituel) et sans callout.

### Callout d'information

- [ ] Quand le SnapshotWizard est ouvert avec une pré-sélection issue d'un groupe actif identifié et que cette pré-sélection est strictement partielle (au moins un onglet de la fenêtre n'est pas pré-coché), un callout d'information apparaît en haut du wizard (`data-testid="wizard-snapshot-group-callout"`) pour signaler que la sélection est restreinte au groupe actif et qu'elle reste extensible.
- [ ] Si tous les onglets de la fenêtre sont déjà pré-cochés (la fenêtre ne contient que le groupe actif), le callout n'est pas affiché.
- [ ] Si l'utilisateur étend la sélection à tous les onglets après ouverture, le callout disparaît (sélection complète).
- [ ] Si aucun `groupId` n'est passé (chemin « save all » classique), le callout n'est pas affiché.
- [ ] Si le `groupId` est invalide (groupe disparu), le callout n'est pas affiché.

### Règles métier

| Situation | Callout | Nom de session par défaut | Onglets pré-cochés |
|---|---|---|---|
| Fenêtre = groupe actif uniquement | Non | Titre du groupe (ou « Snapshot \<date\> ») | Tous (= groupe) |
| Fenêtre = groupe actif + onglets hors groupe | Oui | Titre du groupe (ou « Snapshot \<date\> ») | Onglets du groupe |
| Fenêtre = plusieurs groupes | Oui | Titre du groupe actif (ou « Snapshot \<date\> ») | Onglets du groupe actif |
| Pas de groupe actif (chemin « save all ») | Non | « Snapshot \<date\> » | Tous |
| `groupId` inconnu au moment de la capture | Non | « Snapshot \<date\> » | Tous |
