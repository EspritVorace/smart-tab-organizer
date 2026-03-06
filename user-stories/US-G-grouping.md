# User Stories — Domaine G : Regroupement automatique d'onglets

> Comportements testés dans `tests/e2e/grouping.spec.ts` non couverts par les US existantes (US-S001→S008, US-E001→E002, US-P001→P004, US-PO001→PO002, US-W001, US-O001).

---

## US-G001 — Activation globale du regroupement

**En tant qu'** utilisateur de l'extension,
**je veux** pouvoir activer ou désactiver le regroupement automatique de façon globale,
**afin de** contrôler si mes onglets sont organisés en groupes lors de l'ouverture d'un lien.

### Critères d'acceptation

- [ ] Quand le regroupement global est **activé** et qu'une règle de domaine correspond, un onglet enfant ouvert depuis un onglet parent est automatiquement placé dans un groupe.
- [ ] Quand le regroupement global est **désactivé**, aucun onglet n'est regroupé, même si une règle de domaine correspondante existe.
- [ ] Quand **aucune règle** ne correspond au domaine de l'onglet ouvert, aucun groupe n'est créé.
- [ ] Le compteur `tabGroupsCreatedCount` dans les statistiques reste à 0 quand aucun groupe n'est créé.

---

## US-G002 — Paramètres de regroupement par règle

**En tant qu'** utilisateur,
**je veux** que chaque règle de domaine puisse activer ou désactiver le regroupement indépendamment du paramètre global,
**afin de** gérer finement les domaines qui méritent un regroupement.

### Critères d'acceptation

- [ ] Quand une règle a `groupingEnabled = false`, les onglets du domaine correspondant ne sont **pas** regroupés, même si le regroupement global est activé.
- [ ] Quand une règle est désactivée (`enabled = false`), elle est ignorée et aucun groupe n'est créé pour ce domaine.

---

## US-G003 — Sources du nom de groupe

**En tant qu'** utilisateur,
**je veux** choisir comment le nom d'un groupe est déterminé (label, URL, titre de page, ou automatique),
**afin de** personnaliser l'identification visuelle de mes groupes d'onglets.

### Critères d'acceptation

- [ ] `groupNameSource = label` : le nom du groupe est le **label** de la règle de domaine.
- [ ] `groupNameSource = url` : le nom du groupe est **extrait de l'URL** de l'onglet parent grâce à l'expression régulière `urlParsingRegEx`; en cas d'échec d'extraction, repli sur le label.
- [ ] `groupNameSource = title` : le nom du groupe est **extrait du titre** de la page parente grâce à `titleParsingRegEx`; en cas d'échec d'extraction, repli sur le label.
- [ ] `groupNameSource = smart_label` : utilise la même logique que `title` mais replie sur le label si l'extraction échoue.
- [ ] Une expression régulière **invalide** (syntaxiquement incorrecte) ne provoque pas de crash de l'extension; un groupe est tout de même créé avec le label comme nom de repli.

---

## US-G004 — Couleur du groupe

**En tant qu'** utilisateur,
**je veux** définir la couleur d'un groupe dans la règle de domaine,
**afin de** distinguer visuellement mes groupes dans la barre d'onglets.

### Critères d'acceptation

- [ ] La couleur spécifiée dans la règle (`blue`, `red`, `green`, `purple`, etc.) est correctement appliquée au groupe créé par le navigateur.
- [ ] Quand aucune couleur n'est spécifiée (`color = ""`), Chrome assigne sa couleur par défaut et le groupe est tout de même créé.

---

## US-G005 — Comportement avec un groupe existant

**En tant qu'** utilisateur,
**je veux** que les onglets enfants successifs ouverts depuis le même onglet parent rejoignent le groupe existant,
**afin d'** éviter la multiplication de groupes redondants.

### Critères d'acceptation

- [ ] Un premier onglet enfant crée un nouveau groupe; le compteur `tabGroupsCreatedCount` passe à 1.
- [ ] Un deuxième onglet enfant ouvert depuis le **même** onglet parent est ajouté au groupe existant sans créer de nouveau groupe.
- [ ] Le nombre d'onglets dans le groupe augmente à chaque enfant ajouté.
- [ ] Un nouvel onglet parent (distinct) crée un **nouveau** groupe séparé; `tabGroupsCreatedCount` s'incrémente.

---

## US-G006 — Règles multiples et priorité

**En tant qu'** utilisateur,
**je veux** définir plusieurs règles de domaine et que la plus spécifique s'applique,
**afin d'** avoir des comportements différents selon le domaine exact.

### Critères d'acceptation

- [ ] Quand plusieurs règles existent, chaque domaine utilise la règle qui lui correspond (ex. `example.com` → groupe bleu, `httpbin.org` → groupe rouge).
- [ ] En cas de correspondances multiples pour un même domaine, la **première règle** de la liste gagne (ex. `www.example.com` est prioritaire sur `example.com`).
- [ ] Les domaines sans règle correspondante ne sont pas regroupés.

---

## US-G007 — Statistiques de regroupement

**En tant qu'** utilisateur,
**je veux** que le compteur de groupes créés reflète fidèlement l'activité réelle,
**afin de** suivre l'efficacité de l'extension.

### Critères d'acceptation

- [ ] `tabGroupsCreatedCount` s'incrémente de 1 uniquement lorsqu'un **nouveau** groupe est créé.
- [ ] Quand un onglet est ajouté à un groupe existant, le compteur **ne s'incrémente pas**.
- [ ] Quand un second groupe est créé (domaine différent ou nouvel onglet parent distinct), le compteur atteint 2.

---

## US-G008 — Cas limite : ouvertures simultanées

**En tant qu'** utilisateur,
**je veux** que l'extension gère correctement plusieurs onglets enfants ouverts simultanément depuis le même parent,
**afin d'** éviter la création de groupes dupliqués.

### Critères d'acceptation

- [ ] Quand trois onglets enfants sont créés en parallèle depuis le même onglet parent, **un seul** groupe est créé (`tabGroupsCreatedCount = 1`).
- [ ] Le groupe résultant contient au moins deux des onglets enfants.

---

## US-G009 — Détection du clic du milieu (middle-click)

**En tant qu'** utilisateur,
**je veux** que les onglets ouverts par un clic du milieu sur un lien soient automatiquement regroupés,
**afin d'** organiser mes onglets sans action manuelle.

### Critères d'acceptation

- [ ] Le content script intercepte l'événement `auxclick` (bouton 1) sur les liens et enregistre l'URL cible dans `middleClickedTabs`.
- [ ] Quand l'onglet enfant est ensuite créé avec le bon `openerTabId`, le background retrouve l'entrée dans `middleClickedTabs` et crée le groupe.
- [ ] Quand un onglet enfant est créé avec un `openerTabId` mais **sans** que le content script ait enregistré un clic (ex. raccourci clavier), aucun groupe n'est créé.
- [ ] Un deuxième onglet enfant ouvert naturellement depuis le même parent rejoint le groupe existant.
- [ ] Le regroupement global désactivé empêche la création de groupe même via la voie naturelle.

---

## US-G010 — Détection du clic droit (contextmenu)

**En tant qu'** utilisateur,
**je veux** que les onglets ouverts via un clic droit → "Ouvrir dans un nouvel onglet" soient également regroupés,
**afin de** couvrir tous les modes d'ouverture habituels d'un lien.

### Critères d'acceptation

- [ ] Le content script intercepte l'événement `contextmenu` sur les liens et enregistre l'URL cible dans `middleClickedTabs`.
- [ ] Quand l'utilisateur ouvre ensuite un onglet avec cet `openerTabId`, le groupe est créé de façon identique au clic du milieu.
- [ ] Le groupe créé reçoit la couleur et le nom définis dans la règle de domaine correspondante.
