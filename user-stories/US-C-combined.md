# User Stories — Domaine C : Interactions entre Regroupement et Déduplication

> Comportements testés dans `tests/e2e/combined.spec.ts` non couverts par les US existantes (US-S001→S008, US-E001→E002, US-P001→P004, US-PO001→PO002, US-W001, US-O001).

---

## US-C001 — Regroupement et déduplication activés simultanément

**En tant qu'** utilisateur,
**je veux** que le regroupement et la déduplication fonctionnent ensemble de façon cohérente,
**afin d'** avoir à la fois des onglets organisés en groupes et sans doublons.

### Critères d'acceptation

- [ ] Quand les deux fonctionnalités sont activées sur une règle, un onglet enfant est d'abord regroupé avec son parent, et un doublon ultérieur de cet onglet est dédupliqué.
- [ ] Quand un doublon d'un onglet est créé, il est **dédupliqué avant** d'être potentiellement regroupé (la déduplication prend priorité).
- [ ] Les statistiques reflètent correctement les deux opérations : `tabGroupsCreatedCount` augmente lors de la création d'un groupe, `tabsDeduplicatedCount` augmente lors d'une déduplication.

---

## US-C002 — Paramètres indépendants par fonctionnalité dans une même règle

**En tant qu'** utilisateur,
**je veux** pouvoir activer l'une des fonctionnalités sans l'autre sur une même règle de domaine,
**afin de** personnaliser finement le comportement pour chaque site.

### Critères d'acceptation

- [ ] Quand `groupingEnabled = true` et `deduplicationEnabled = false` : les onglets enfants sont regroupés, les doublons sont conservés (`tabGroupsCreatedCount = 1`, `tabsDeduplicatedCount = 0`).
- [ ] Quand `groupingEnabled = false` et `deduplicationEnabled = true` : les doublons sont supprimés, aucun groupe n'est créé (`tabGroupsCreatedCount = 0`, nombre de groupes = 0, `tabsDeduplicatedCount > 0`).

---

## US-C003 — Règles multiples avec paramètres mixtes

**En tant qu'** utilisateur,
**je veux** que chaque domaine suive ses propres paramètres de regroupement et de déduplication,
**afin de** gérer plusieurs sites avec des comportements différents dans une seule configuration.

### Critères d'acceptation

- [ ] Le domaine A (règle : group only) voit ses onglets regroupés mais pas dédupliqués.
- [ ] Le domaine B (règle : dedup only) voit ses doublons supprimés mais aucun groupe créé.
- [ ] Les statistiques de chaque fonctionnalité reflètent uniquement les actions ayant eu lieu sur les domaines concernés.

---

## US-C004 — Priorité règle > paramètre global

**En tant qu'** utilisateur,
**je veux** que la règle d'un domaine écrase les paramètres globaux pour ce domaine,
**afin d'** avoir des exceptions explicites aux comportements globaux.

### Critères d'acceptation

- [ ] Quand les deux fonctionnalités sont activées globalement mais qu'une règle les désactive toutes les deux pour un domaine (`groupingEnabled = false`, `deduplicationEnabled = false`), aucune action n'est réalisée sur ce domaine (`tabGroupsCreatedCount = 0`, `tabsDeduplicatedCount = 0`).
- [ ] Un domaine **sans règle correspondante** utilise les paramètres globaux (ex. si le global est activé, les doublons de ce domaine sont dédupliqués).

---

## US-C005 — Scénarios complexes de navigation

**En tant qu'** utilisateur,
**je veux** que l'extension gère correctement les workflows de navigation multi-domaines et multi-projets,
**afin de** rester efficace dans mes cas d'utilisation réels.

### Critères d'acceptation

- [ ] **Simulation navigation GitHub** : les onglets d'un même dépôt (README, fichiers sources) sont regroupés en un seul groupe; l'ouverture d'un onglet en double (ex. README déjà ouvert) déclenche une déduplication.
  - Résultat attendu : 1 groupe créé, au moins 1 déduplication, exactement 1 groupe visible.
- [ ] **Deux projets distincts** : chaque projet génère son propre groupe (nommé d'après l'identifiant extrait de l'URL via regex). Deux openers distincts créent deux groupes distincts (`tabGroupsCreatedCount = 2`, nombre de groupes visibles = 2).
