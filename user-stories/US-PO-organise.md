# User Stories — Domaine PO : Bouton "Organiser les onglets"

> Comportements à tester dans `tests/e2e/popup-organize.spec.ts`.
> Les US numérotées ci-dessous font suite à US-PO005.

---

## US-PO006 — Bouton "Organiser les onglets" dans le popup

**En tant qu'** utilisateur de l'extension,
**je veux** un bouton dans le popup qui déclenche la déduplication puis le regroupement de tous mes onglets ouverts,
**afin d'** organiser en un clic tous mes onglets existants selon mes règles configurées.

### Critères d'acceptation

- [ ] Le popup affiche un bouton libellé "Organiser les onglets" (i18n : clé `organizeAllTabs`) avec l'icône `Wand2` de Lucide.
- [ ] Le bouton est désactivé (`disabled`) pendant l'exécution de l'opération, avec un indicateur visuel de chargement.
- [ ] Cliquer le bouton ferme le popup après déclenchement de l'opération (le traitement continue en background).
- [ ] Le bouton est toujours visible dans le popup, même si les toggles de regroupement ou de déduplication globaux sont désactivés. L'action manuelle est indépendante des toggles automatiques.

---

## US-PO007 — Déduplication manuelle globale

**En tant qu'** utilisateur qui clique sur "Organiser les onglets",
**je veux** que tous les doublons d'onglets (couverts par des règles actives, et optionnellement ceux des domaines sans règle) soient fermés,
**afin d'** éliminer les doublons existants avant le regroupement.

### Critères d'acceptation

- [ ] Les onglets dont le domaine correspond à une règle **active** (`enabled = true`) avec `deduplicationEnabled = true` sont traités selon le `deduplicationMatchMode` de la règle.
- [ ] Les onglets dont le domaine **ne correspond à aucune règle** sont traités en mode `exact` uniquement si `deduplicateUnmatchedDomains = true`; sinon ils sont ignorés (conforme à US-D008).
- [ ] Pour chaque groupe de doublons (selon le mode de correspondance de la règle concernée), l'onglet conservé est celui dont l'`index` est le plus faible dans la fenêtre (le plus à gauche).
- [ ] L'onglet conservé est rechargé (`chrome.tabs.reload`).
- [ ] Tous les onglets dédupliqués sont fermés via `chrome.tabs.remove` en une seule opération batch (appel unique avec un tableau d'IDs).
- [ ] Le compteur `tabsDeduplicatedCount` est incrémenté du nombre d'onglets fermés.
- [ ] Si aucun doublon n'est trouvé, aucune notification n'est affichée pour la déduplication.
- [ ] Si au moins un doublon est trouvé, une notification Chrome unique est affichée à la fin indiquant le nombre total d'onglets fermés (ex. : "3 onglets en double supprimés"), sans notification individuelle par onglet.
- [ ] Les onglets avec des schémas spéciaux (`chrome:`, `chrome-extension:`, `about:`) sont ignorés.

---

## US-PO008 — Regroupement manuel global

**En tant qu'** utilisateur qui clique sur "Organiser les onglets",
**je veux** que tous les onglets ouverts dont le domaine correspond à une règle active soient regroupés selon cette règle,
**afin d'** organiser en groupes les onglets existants qui ne l'ont pas encore été.

### Critères d'acceptation

**Phase de planification (avant toute modification)**

- [ ] Le regroupement s'exécute **après** la déduplication (les onglets fermés à l'étape précédente ne sont plus présents).
- [ ] Avant toute modification, une phase de planification calcule pour chaque onglet éligible son groupe cible (nom + règle). Aucun onglet n'est déplacé pendant cette phase.
- [ ] Seuls les onglets dont le domaine correspond à une règle **active** (`enabled = true`) avec `groupingEnabled = true` sont éligibles.
- [ ] Pour chaque onglet éligible, le nom du groupe cible est calculé selon `groupNameSource` et `titleParsingRegEx` / `urlParsingRegEx` de la règle correspondante (même logique que le regroupement automatique existant).
- [ ] Un groupe cible dont le plan ne contient qu'un seul onglet **non encore groupé** est abandonné : l'onglet reste sans groupe.
- [ ] Un onglet déjà présent dans un groupe Chrome existant **avant l'action Organiser**, et dont le groupe cible planifié ne compterait qu'un seul membre, est laissé dans son groupe existant sans modification.

**Phase d'application**

- [ ] Un onglet déjà présent dans un groupe Chrome dont le titre correspond au groupe cible planifié n'est pas déplacé.
- [ ] Un onglet déjà dans un groupe dont le titre **ne correspond pas** au groupe cible planifié est retiré de son groupe actuel et replacé dans le groupe correct, sous réserve que ce groupe cible compte au moins deux membres dans le plan.
- [ ] Les onglets sans règle correspondante ne sont pas touchés.
- [ ] Les onglets avec des schémas spéciaux (`chrome:`, `chrome-extension:`, `about:`) sont ignorés.
- [ ] Le compteur `tabGroupsCreatedCount` est incrémenté uniquement pour les nouveaux groupes créés (pas pour les groupes déjà existants où des onglets sont simplement ajoutés).

**Repositionnement et repli (fenêtre active uniquement)**

- [ ] Une fois le regroupement terminé, tous les groupes d'onglets de la fenêtre active sont déplacés en premières positions (indices les plus bas), avant les onglets non groupés.
- [ ] L'ordre relatif des groupes entre eux est conservé (le groupe qui était le plus à gauche reste le plus à gauche parmi les groupes).
- [ ] Tous les groupes d'onglets de la fenêtre active sont repliés (`collapsed: true`) via `chrome.tabGroups.update`.
- [ ] Les onglets non groupés ne sont pas déplacés (ils se retrouvent après les groupes).

**Notifications**

- [ ] Si au moins un groupe a été créé ou modifié, une notification Chrome unique est affichée à la fin (ex. : "5 onglets regroupés en 3 groupes").
- [ ] Si aucun onglet n'a été regroupé, aucune notification n'est affichée.

---

## US-PO009 — Comportement du regroupement automatique existant inchangé

**En tant qu'** utilisateur qui ouvre des onglets normalement (clic molette, clic droit),
**je veux** que le comportement automatique de regroupement ne soit pas affecté par les nouvelles règles de l'action Organiser,
**afin de** garder mon flux de travail habituel intact.

### Critères d'acceptation

- [ ] Le regroupement automatique (déclenché à l'ouverture d'un onglet) ne vérifie pas le nombre de membres du groupe cible : un onglet peut être placé seul dans un nouveau groupe comme avant.
- [ ] Le regroupement automatique ne replie pas et ne repositionne pas les groupes existants.
