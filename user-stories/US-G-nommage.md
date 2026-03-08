# User Stories — Domaine G : Nommage des groupes (compléments US-G011→G017)

> Comportements identifiés dans le code source (`src/background/grouping.ts`,
> `src/schemas/domainRule.ts`, `src/schemas/enums.ts`,
> `public/data/presets.json`) non couverts par US-G003 ni par les autres US
> existantes. Les IDs continuent la numérotation de `US-G-grouping.md`
> (US-G001→G010).

---

## US-G011 — Mode de nommage manuel (`groupNameSource = manual`)

**En tant qu'** utilisateur,
**je veux** être invité à saisir moi-même le nom du groupe à chaque création,
**afin de** lui attribuer un nom précis adapté à mon contexte de travail.

### Critères d'acceptation

- [ ] Quand `groupNameSource = manual`, une invite de saisie est présentée à l'utilisateur immédiatement après la création d'un groupe.
- [ ] Le **label** de la règle est proposé comme valeur par défaut dans l'invite.
- [ ] Si l'utilisateur saisit un nom et valide, le groupe est renommé avec ce nom.
- [ ] Si l'utilisateur **annule** l'invite (sans saisir de nom), les onglets qui venaient d'être regroupés sont immédiatement **dégroupés** — l'opération de groupage est annulée dans son intégralité.

---

## US-G012 — Mode intelligent avec preset (`groupNameSource = smart`)

**En tant qu'** utilisateur,
**je veux** que l'extension tente automatiquement d'extraire un nom depuis le titre puis l'URL de l'onglet parent en s'appuyant sur les regex du preset sélectionné,
**afin d'** obtenir un nom contextuel sans avoir à configurer les expressions régulières manuellement.

### Critères d'acceptation

- [ ] En mode `smart` avec un `presetId` défini, l'extension tente d'abord l'extraction depuis le **titre** de l'onglet parent via `titleParsingRegEx` du preset.
- [ ] Si l'extraction du titre échoue (pas de correspondance ou regex invalide), l'extension tente l'extraction depuis l'**URL** via `urlParsingRegEx`.
- [ ] Si les deux extractions réussissent, la valeur extraite du titre est prioritaire.
- [ ] Si les deux extractions échouent, le **label** de la règle est utilisé comme nom de groupe.
- [ ] Si `presetId` est absent (règle sans preset), l'extension revient directement au **label** sans tentative d'extraction.

---

## US-G013 — Mode intelligent avec invite de repli (`groupNameSource = smart_manual`)

**En tant qu'** utilisateur,
**je veux** que l'extension tente l'extraction automatique et, si elle échoue, me propose de saisir le nom manuellement,
**afin d'** avoir toujours un nom pertinent même sur des sites que les regex ne couvrent pas.

### Critères d'acceptation

- [ ] En mode `smart_manual`, la stratégie d'extraction est identique à `smart` (titre → URL → échec).
- [ ] Si l'extraction **réussit**, le groupe est nommé automatiquement avec la valeur extraite — aucune invite n'est affichée.
- [ ] Si l'extraction **échoue**, une invite de saisie est présentée à l'utilisateur (même comportement que le mode `manual`).
- [ ] Si l'utilisateur annule l'invite, les onglets sont **dégroupés**.

---

## US-G014 — Mode intelligent avec nom du preset comme repli (`groupNameSource = smart_preset`)

**En tant qu'** utilisateur,
**je veux** que l'extension utilise le nom du preset sélectionné comme repli lorsque l'extraction échoue,
**afin d'** avoir un nom de groupe cohérent avec le type de site même sans extraction réussie.

### Critères d'acceptation

- [ ] En mode `smart_preset`, l'extraction est tentée de la même façon que `smart` (titre puis URL via preset).
- [ ] Si l'extraction **réussit**, la valeur extraite est utilisée comme nom du groupe.
- [ ] Si l'extraction **échoue** mais qu'un `presetId` est défini, le **nom du preset** (ex. « GitHub – Issue ») est utilisé comme nom du groupe.
- [ ] Si ni l'extraction ni le preset ne fournissent de nom, le **label** de la règle est utilisé en dernier recours.

---

## US-G015 — Chaîne de priorité du nommage selon le mode

**En tant que** service worker de l'extension,
**je veux** que chaque mode de nommage suive une hiérarchie de fallback clairement définie,
**afin de** garantir qu'un groupe reçoit toujours un nom, même dans les cas dégradés.

### Critères d'acceptation

| Mode | Priorité |
|---|---|
| `label` | label de la règle → `"SmartGroup"` |
| `url` | extraction URL → label → `"SmartGroup"` |
| `title` | extraction titre → label → `"SmartGroup"` |
| `smart_label` | extraction (titre puis URL) → label → `"SmartGroup"` |
| `smart` | extraction (titre puis URL via preset) → label → `"SmartGroup"` |
| `smart_preset` | extraction → nom du preset → label → `"SmartGroup"` |
| `smart_manual` | extraction → invite utilisateur → dégroupage si annulation |
| `manual` | invite utilisateur (label proposé) → dégroupage si annulation |

- [ ] Le nom de dernier recours absolu est `"SmartGroup"` (utilisé quand le label est lui-même vide).
- [ ] Une erreur de regex (syntaxe invalide) est tracée en avertissement mais n'empêche pas la création du groupe : le fallback est appliqué.
- [ ] L'extraction utilise toujours le **premier groupe de capture** `(...)` de l'expression régulière.

---

## US-G016 — Système de presets de regex intégrés

**En tant qu'** utilisateur qui configure une règle de domaine,
**je veux** pouvoir sélectionner un preset parmi une liste de regex prédéfinies pour les sites courants,
**afin de** configurer rapidement mes règles sans écrire moi-même les expressions régulières.

### Critères d'acceptation

- [ ] **50 presets** sont disponibles, répartis en 10 catégories :
  Générique, Développement & Code, Productivité & Tickets, E-commerce, Voyage & Réservations, Recherche & Documentation, Réseaux sociaux, Streaming & Médias, Cloud & Infrastructure, Finance & Banque.
- [ ] Sélectionner un preset **auto-renseigne** `titleParsingRegEx` et `urlParsingRegEx` dans la règle.
- [ ] Sélectionner un preset **définit automatiquement** `groupNameSource` selon la stratégie recommandée par ce preset.
- [ ] Chaque preset expose un champ `example` et `description` pour guider l'utilisateur dans l'interface.
- [ ] Quand un `presetId` est défini sur la règle, les champs de regex sont **optionnels** (ils sont copiés depuis le preset au moment du traitement).

---

## US-G017 — Validation conditionnelle des champs de regex

**En tant qu'** utilisateur qui configure une règle de domaine,
**je veux** que les champs de regex obligatoires soient clairement signalés selon le mode de nommage choisi,
**afin d'** éviter de créer une règle incomplète ou silencieusement inefficace.

### Critères d'acceptation

- [ ] En mode `groupNameSource = title` **sans** `presetId` : `titleParsingRegEx` est **obligatoire** — une erreur de validation est affichée si le champ est vide.
- [ ] En mode `groupNameSource = url` **sans** `presetId` : `urlParsingRegEx` est **obligatoire** — idem.
- [ ] En mode `manual` : aucun champ de regex n'est requis.
- [ ] En modes `smart*` **avec** `presetId` : les champs de regex sont facultatifs (auto-remplis depuis le preset).
- [ ] Une regex syntaxiquement invalide est signalée par un message d'erreur (`errorInvalidRegex`).
- [ ] Une regex **sans groupe de capture** `(...)` est également invalide et signalée par la même erreur.
