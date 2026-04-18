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

## US-PO005 — Affichage conditionnel de la section Sessions épinglées dans le popup

**En tant qu'** utilisateur du popup,
**je veux** que la section « Pinned sessions » n'apparaisse que s'il existe au moins une session épinglée,
**afin que** le popup reste concis quand aucune session n'a été épinglée.

### Critères d'acceptation

- [ ] Quand aucune session épinglée n'existe (seuls des snapshots), la section « Pinned sessions » n'est **pas** visible dans le popup.
- [ ] Quand au moins une session épinglée existe, la section « Pinned sessions » et le nom de la session sont visibles.
- [ ] Toutes les sessions épinglées sont listées dans la section.
- [ ] Les sessions non épinglées ne sont **pas** affichées dans la liste.
- [ ] Chaque ligne dispose d'un bouton de restauration rapide (« Restore options ») dont le menu expose les 4 options : `current`, `new`, `replace` (« Replace tabs in current window »), `customize`.
- [ ] L'option `replace` remplace les onglets non épinglés de la fenêtre active par ceux de la session choisie et affiche une notification système « Session activated » confirmant la bascule, puis ferme la popup.
