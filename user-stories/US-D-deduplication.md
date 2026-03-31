# User Stories — Domaine D : Déduplication automatique d'onglets

> Comportements testés dans `tests/e2e/deduplication.spec.ts` non couverts par les US existantes (US-S001→S008, US-E001→E002, US-P001→P004, US-PO001→PO002, US-W001, US-O001).

---

## US-D001 — Activation globale de la déduplication

**En tant qu'** utilisateur de l'extension,
**je veux** pouvoir activer ou désactiver la déduplication automatique de façon globale,
**afin de** contrôler si les onglets en double sont fermés automatiquement.

### Critères d'acceptation

- [ ] Quand la déduplication globale est **activée**, ouvrir un onglet avec une URL déjà ouverte ferme l'onglet en double et focus l'onglet existant.
- [ ] Quand la déduplication globale est **désactivée**, les onglets en double sont conservés; `tabsDeduplicatedCount` reste à 0.
- [ ] Deux onglets avec des **URLs différentes** ne sont jamais dédupliqués, même si la déduplication globale est activée.
- [ ] Le compteur `tabsDeduplicatedCount` s'incrémente uniquement quand une déduplication a lieu.

---

## US-D002 — Paramètres de déduplication par règle

**En tant qu'** utilisateur,
**je veux** que chaque règle de domaine puisse activer ou désactiver la déduplication indépendamment du paramètre global,
**afin de** gérer finement les domaines où les doublons sont souhaitables.

### Critères d'acceptation

- [ ] Quand une règle a `deduplicationEnabled = true`, les onglets en double du domaine correspondant sont supprimés.
- [ ] Quand une règle a `deduplicationEnabled = false`, les doublons du domaine correspondant sont conservés, même si le global est activé.
- [ ] Quand une règle est **désactivée** (`enabled = false`), elle est ignorée et le paramètre global s'applique à ce domaine.

---

## US-D003 — Mode de correspondance : exact

**En tant qu'** utilisateur,
**je veux** pouvoir configurer la déduplication en mode « exact »,
**afin de** ne fermer un onglet que s'il pointe vers exactement la même URL.

### Critères d'acceptation

- [ ] En mode `exact`, deux URLs identiques (même protocole, domaine, chemin, query string, fragment) sont considérées comme doublons et l'une est fermée.
- [ ] En mode `exact`, deux URLs qui diffèrent **uniquement par le query string** (`?param=a` vs `?param=b`) sont considérées comme distinctes et conservées.
- [ ] En mode `exact`, deux URLs qui diffèrent **uniquement par le fragment** (`#section1` vs `#section2`) sont considérées comme distinctes et conservées.
- [ ] Un onglet avec le même fragment qu'un onglet existant est correctement dédupliqué (`#section1` vs `#section1`).

---

## US-D004 — Mode de correspondance : includes

**En tant qu'** utilisateur,
**je veux** pouvoir configurer la déduplication en mode « includes »,
**afin de** fermer un onglet si son URL est contenue dans une URL déjà ouverte (ou vice-versa).

### Critères d'acceptation

- [ ] En mode `includes`, si l'URL du nouvel onglet est une **sous-chaîne** de l'URL d'un onglet existant, le nouvel onglet est considéré comme doublon et fermé.
  - Exemple : `/products/item` est contenu dans `/products/item/123` → dédupliqué.
- [ ] En mode `includes`, deux URLs sans relation de sous-chaîne (ex. `/products` et `/about`) ne sont **pas** dédupliquées.

---

## US-D005 — Règles multiples et domaines sans règle

**En tant qu'** utilisateur,
**je veux** que chaque domaine suive sa propre règle de déduplication,
**afin de** maintenir des comportements différenciés selon les sites.

### Critères d'acceptation

- [ ] Un domaine avec une règle `deduplicationEnabled = true` voit ses doublons supprimés.
- [ ] Un domaine avec une règle `deduplicationEnabled = false` conserve ses doublons, même si le global est activé.
- [ ] Un domaine **sans règle** utilise le paramètre de déduplication global.

---

## US-D006 — Cas limites de la déduplication

**En tant que** développeur de l'extension,
**je veux** que la déduplication soit robuste face aux cas limites,
**afin de** garantir la stabilité de l'extension dans tous les scénarios.

### Critères d'acceptation

- [ ] Les onglets avec des schémas spéciaux (`about:`, `chrome:`, `chrome-extension:`) ne provoquent pas de crash et sont ignorés par la déduplication.
- [ ] Quand plusieurs onglets en double sont créés rapidement en parallèle, au moins quelques-uns sont dédupliqués (`tabsDeduplicatedCount > 0`).
- [ ] Un filtre de domaine ciblant un sous-domaine (ex. `www.example.com`) matche correctement les URLs de ce sous-domaine.

---

## US-D007 — Statistiques de déduplication

**En tant qu'** utilisateur,
**je veux** que le compteur de déduplications reflète précisément le nombre d'onglets fermés,
**afin de** mesurer l'utilité de la fonctionnalité.

### Critères d'acceptation

- [ ] `tabsDeduplicatedCount` commence à 0 après une réinitialisation des statistiques.
- [ ] Le compteur s'incrémente de **1** exactement à chaque fermeture d'un onglet doublon.
- [ ] Après deux déduplications successives pour la même URL, le compteur vaut 2.
