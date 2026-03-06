# User Stories — Domaine PO : Popup (compléments)

> Comportements testés dans `tests/e2e/popup.spec.ts` non couverts par les US-PO001→PO002 existantes.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-PO003.

---

## US-PO003 — Deep linking : accès direct à la section Sessions

**En tant qu'** utilisateur ou développeur de l'extension,
**je veux** pouvoir accéder directement à la section Sessions de la page Options via un hash d'URL,
**afin de** naviguer vers la bonne section sans interaction supplémentaire.

### Critères d'acceptation

- [ ] Naviguer vers `options.html#sessions` affiche directement la section Sessions (titre ou état vide visible).

---

## US-PO004 — Deep linking : ouverture automatique du wizard de snapshot

**En tant qu'** utilisateur qui clique sur le bouton « Save » dans le popup,
**je veux** être redirigé vers la page Options avec le wizard de snapshot déjà ouvert,
**afin de** démarrer la prise de snapshot en un minimum d'étapes.

### Critères d'acceptation

- [ ] Naviguer vers `options.html#sessions?action=snapshot` ouvre automatiquement le dialogue wizard « Save Session Snapshot » (dialogue visible avec ce titre).
- [ ] Le bouton « Save » dans le popup redirige vers `options.html` avec les paramètres `sessions` et `action=snapshot` dans l'URL.

---

## US-PO005 — Affichage conditionnel de la section Profils dans le popup

**En tant qu'** utilisateur du popup,
**je veux** que la section « Profiles » n'apparaisse que s'il existe au moins un profil épinglé,
**afin que** le popup reste concis quand aucun profil n'a été créé.

### Critères d'acceptation

- [ ] Quand aucun profil épinglé n'existe (seuls des snapshots), la section « Profiles » n'est **pas** visible dans le popup.
- [ ] Quand au moins un profil épinglé existe, la section « Profiles » et le nom du profil sont visibles.
- [ ] Tous les profils épinglés sont listés dans la section (Work Profile, Personal Profile, etc.).
- [ ] Les snapshots (non épinglés) ne sont **pas** affichés dans la liste des profils du popup.
- [ ] Chaque ligne de profil dispose d'un bouton de restauration rapide (« Restore options »).
