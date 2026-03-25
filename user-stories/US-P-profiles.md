# User Stories — Domaine P : Profils (compléments)

> Comportements testés dans `tests/e2e/profiles.spec.ts` non couverts par les US-P001→P004 existantes.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-P005.

---

## US-P005 — Désépinglage d'un profil (Unpin)

**En tant qu'** utilisateur,
**je veux** pouvoir désépingler un profil pour le reconvertir en snapshot ordinaire,
**afin de** réorganiser mes sessions sauvegardées sans les supprimer.

### Critères d'acceptation

- [ ] Un bouton « Unpin » est visible sur chaque carte de profil (session épinglée).
- [ ] Cliquer « Unpin » met à jour la session dans le stockage : `isPinned` passe à `false`.

---

## US-P008 — Sélection et persistance de l'icône de profil

**En tant qu'** utilisateur,
**je veux** choisir une icône personnalisée pour chaque profil,
**afin de** les différencier visuellement dans la liste et dans le popup.

### Critères d'acceptation

- [ ] L'option « Change Icon » est disponible dans le menu « More actions » des cartes de **profil**.
- [ ] L'option « Change Icon » peut être cliquée sans provoquer d'erreur.
- [ ] Le changement d'icône d'un profil est persisté dans `chrome.storage.local` (le champ `icon` de la session est mis à jour).

---

## US-P009 — Tooltip et badge d'icône sur les cartes de profil

**En tant qu'** utilisateur,
**je veux** que l'icône de profil affichée sur la carte soit accompagnée d'un tooltip explicatif,
**afin de** comprendre rapidement ce que représente le badge visuel.

### Critères d'acceptation

- [ ] Survoler la zone d'icône (badge coloré en haut à gauche) d'une carte de profil affiche un tooltip.
- [ ] Le bouton « New Profile » dans la barre d'outils (à droite du champ de recherche) affiche également un tooltip au survol.
