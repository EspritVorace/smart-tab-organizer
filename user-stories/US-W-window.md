# User Stories — Domaine W : Exclusivité fenêtre/profil (compléments)

> Comportements testés dans `tests/e2e/window-exclusivity.spec.ts` non couverts par US-W001 existante.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-W002.

---

## US-W002 — Avertissement dans le popup quand un profil est déjà ouvert

**En tant qu'** utilisateur consultant le popup,
**je veux** être averti visuellement quand un profil est déjà actif dans une autre fenêtre,
**afin d'** éviter d'ouvrir le même profil en double et de créer des conflits de synchronisation.

### Critères d'acceptation

- [ ] Quand un profil est associé à une fenêtre différente de la fenêtre courante (présence d'une entrée dans `profileWindowMap` de `chrome.storage.session`), le popup affiche un indicateur « already open » sur la ligne de ce profil.

---

## US-W003 — Les snapshots ne sont pas soumis à l'exclusivité fenêtre

**En tant qu'** utilisateur,
**je veux** pouvoir restaurer un snapshot dans n'importe quelle fenêtre autant de fois que je le souhaite,
**afin de** conserver la flexibilité des snapshots par rapport aux profils.

### Critères d'acceptation

- [ ] La restauration rapide d'un **snapshot** (non épinglé) dans la fenêtre courante ne crée **aucune** entrée dans `profileWindowMap` (le dictionnaire reste vide).
- [ ] Contrairement aux profils, les snapshots ne sont pas concernés par la logique d'exclusivité fenêtre.
