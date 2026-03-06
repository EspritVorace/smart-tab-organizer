# User Stories — Domaine S : Sessions (compléments)

> Comportements testés dans `tests/e2e/sessions.spec.ts` non couverts par les US-S001→S008 existantes.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-S009.

---

## US-S009 — Visibilité différenciée du toggle auto-sync selon le type de carte

**En tant qu'** utilisateur,
**je veux** que le toggle auto-sync soit visible uniquement sur les cartes de profil (épinglées),
**afin de** distinguer clairement les fonctionnalités disponibles selon le type de session.

### Critères d'acceptation

- [ ] Une carte de **profil** (session épinglée) affiche un toggle switch labellisé « Auto-sync ».
- [ ] Une carte de **snapshot** (session non épinglée) n'affiche **pas** de toggle auto-sync.

---

## US-S010 — Boutons d'action dans l'état vide

**En tant qu'** utilisateur arrivant sur la page Sessions sans aucune session sauvegardée,
**je veux** voir les boutons « Take Snapshot » et « New Profile » dans la zone d'état vide,
**afin de** pouvoir démarrer immédiatement sans chercher les contrôles dans l'en-tête.

### Critères d'acceptation

- [ ] En l'absence de toute session, la zone d'état vide affiche le message « No saved sessions. ».
- [ ] Les boutons « Take Snapshot » et « New Profile » sont tous deux visibles dans la zone d'état vide (en plus des boutons présents dans l'en-tête).

---

## US-S011 — Options du bouton de restauration (split button)

**En tant qu'** utilisateur,
**je veux** pouvoir restaurer une session selon différentes modalités depuis la carte de session,
**afin de** choisir rapidement où les onglets sont ouverts sans passer par le wizard complet.

### Critères d'acceptation

- [ ] Chaque carte de session affiche un bouton principal « Restore » visible.
- [ ] Un chevron de liste déroulante (« Restore options ») est accessible sur chaque carte.
- [ ] La liste déroulante propose au minimum les options : « In current window », « In new window », « Customize… ».
- [ ] L'option « In current window » restaure les onglets et affiche un message de confirmation de succès (ex. « X tab(s) opened »).
- [ ] L'option « Customize… » ouvre le wizard de restauration (dialogue de type `role="dialog"` contenant un texte « Restore »).
