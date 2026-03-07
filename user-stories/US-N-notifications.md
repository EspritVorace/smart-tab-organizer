# User Stories — Domaine N : Notifications avec action Annuler

> Comportements identifiés dans le code source (`src/utils/notifications.ts`,
> `src/background/grouping.ts`, `src/background/deduplication.ts`,
> `src/utils/deduplicationSkip.ts`) et non couverts par les US existantes
> (US-S001→S011, US-E001→E005, US-P001→P009, US-PO001→PO005,
> US-W001→W003, US-O001→O004, US-G001→G010, US-D001→D007,
> US-C001→C005, US-AS001→AS003).

---

## US-N001 — Notification de regroupement avec bouton Annuler

**En tant qu'** utilisateur dont les onglets viennent d'être regroupés automatiquement,
**je veux** recevoir une notification native avec un bouton « Annuler »,
**afin de** pouvoir défaire immédiatement le regroupement si celui-ci n'était pas souhaité.

### Critères d'acceptation

- [ ] Après la création d'un groupe d'onglets, une notification native du navigateur est affichée avec :
  - le titre localisé (ex. « 📁 Tabs Grouped » en anglais, « 📁 Onglets Regroupés » en français) ;
  - un message mentionnant le nom du groupe (ex. « Tabs grouped into "Mon Groupe" »).
- [ ] La notification contient un bouton dont le libellé est localisé : « Undo » (EN), « Annuler » (FR), « Deshacer » (ES).
- [ ] Cliquer sur le bouton Annuler désgroupe immédiatement les onglets qui venaient d'être regroupés (`browser.tabs.ungroup` sur les IDs concernés).
- [ ] La notification se ferme automatiquement après **5 secondes** si l'utilisateur n'interagit pas.
- [ ] La notification n'est affichée que si le paramètre `notifyOnGrouping` est **activé** dans les réglages.
- [ ] Si `notifyOnGrouping` est **désactivé**, aucune notification n'apparaît après un regroupement.

---

## US-N002 — Notification de déduplication avec bouton Annuler

**En tant qu'** utilisateur dont un onglet en double vient d'être fermé automatiquement,
**je veux** recevoir une notification native avec un bouton « Annuler »,
**afin de** pouvoir récupérer l'onglet fermé si la fermeture était indésirable.

### Critères d'acceptation

- [ ] Après la fermeture d'un onglet doublon, une notification native est affichée avec :
  - le titre localisé (ex. « ✂️ Duplicate Closed » / « ✂️ Doublon Fermé ») ;
  - un message mentionnant le titre de l'onglet fermé (ex. « Duplicate tab closed: GitHub »).
- [ ] La notification contient un bouton « Undo » / « Annuler » / « Deshacer » (selon la langue).
- [ ] Cliquer sur le bouton Annuler rouvre l'onglet fermé dans la **même fenêtre** que celle d'origine.
- [ ] L'onglet rouvert devient l'onglet **actif**.
- [ ] La notification se ferme automatiquement après **5 secondes** si l'utilisateur n'interagit pas.
- [ ] La notification n'est affichée que si le paramètre `notifyOnDeduplication` est **activé**.
- [ ] Si `notifyOnDeduplication` est **désactivé**, aucune notification n'apparaît après une déduplication.

---

## US-N003 — Protection contre la re-déduplication après un Annuler

**En tant qu'** utilisateur qui vient de rouvrir un onglet via le bouton Annuler,
**je veux** que cet onglet ne soit pas immédiatement re-fermé par la déduplication,
**afin de** pouvoir utiliser l'onglet récupéré sans qu'il disparaisse à nouveau.

### Critères d'acceptation

- [ ] Lorsqu'un onglet est rouvert via l'action Annuler, son URL est marquée pour **ignorer la déduplication** pendant **10 secondes**.
- [ ] Pendant cette fenêtre de 10 secondes, si un second onglet avec la même URL est déjà ouvert, l'onglet rouvert est **conservé** (non fermé par la déduplication).
- [ ] Au-delà de 10 secondes, la protection expire automatiquement et la déduplication normale reprend pour cette URL.
- [ ] Les entrées expirées dans la liste de protection sont nettoyées automatiquement.

---

## US-N004 — Nettoyage des actions en attente à la fermeture de la notification

**En tant que** service worker de l'extension,
**je veux** nettoyer les actions d'annulation en mémoire quand une notification se ferme,
**afin d'** éviter des fuites mémoire et des actions fantômes.

### Critères d'acceptation

- [ ] Chaque notification est identifiée par un ID unique au format `smarttab-{timestamp}`.
- [ ] L'action d'annulation associée à une notification est stockée en mémoire (Map) pendant la durée de vie de la notification.
- [ ] Quand l'utilisateur ferme la notification **sans** cliquer sur Annuler (fermeture manuelle ou timeout), l'entrée correspondante est **supprimée** de la Map des actions en attente.
- [ ] Après la suppression, il n'est plus possible d'exécuter l'annulation pour cette notification.

---

## US-N005 — Paramètres d'activation des notifications par fonctionnalité

**En tant qu'** utilisateur,
**je veux** pouvoir activer ou désactiver indépendamment les notifications de regroupement et de déduplication,
**afin de** contrôler le niveau d'interruption selon mes préférences.

### Critères d'acceptation

- [ ] Un paramètre `notifyOnGrouping` (booléen) est disponible dans les réglages de l'extension.
  - Quand `true` : une notification apparaît à chaque regroupement réussi.
  - Quand `false` : aucune notification de regroupement n'est émise.
- [ ] Un paramètre `notifyOnDeduplication` (booléen) est disponible dans les réglages.
  - Quand `true` : une notification apparaît à chaque fermeture de doublon.
  - Quand `false` : aucune notification de déduplication n'est émise.
- [ ] Les deux paramètres sont indépendants : on peut notifier sur le regroupement uniquement, sur la déduplication uniquement, sur les deux, ou sur aucun.
