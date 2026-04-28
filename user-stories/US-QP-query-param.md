# User Stories — Domaine QP : Extraction par paramètre de requête URL

> Implémenté dans la PR #177. **US-QP006 (déduplication par query param) est hors périmètre de la V1**, la déduplication n'est pas modifiée par cette feature.

## Contexte

Aujourd'hui, l'extraction du nom de groupe depuis une URL passe obligatoirement par une expression régulière (`urlParsingRegEx`). Pour les pages de recherche (Google, YouTube, Amazon, Stack Overflow, etc.), c'est un overkill : la donnée recherchée est toujours la valeur d'un paramètre de requête (`?q=foo`, `?search_query=bar`, `?k=baz`).

Cette feature introduit un mode d'extraction alternatif basé sur le nom d'un paramètre de requête, plus simple, plus robuste et adapté à 90% des SERP. L'utilisateur choisit entre `regex` et `query param` lorsqu'il configure une extraction depuis l'URL.

**Exemples d'usage :**

| Site | Paramètre |
|---|---|
| Google, Bing, DuckDuckGo, Stack Overflow, Reddit, GitHub, npm, MDN | `q` |
| YouTube | `search_query` |
| Amazon | `k` |
| eBay | `_nkw` |
| Wikipedia (Special:Search) | `search` |

---

## US-QP001 — Choix entre regex et query param pour l'extraction URL

**En tant qu'** utilisateur configurant une règle de domaine,
**je veux** choisir entre une expression régulière et un nom de paramètre de requête comme méthode d'extraction depuis l'URL,
**afin de** configurer rapidement les règles pour les pages de recherche sans écrire de regex.

### Critères d'acceptance

- [x] Le schéma `domainRuleSchema` inclut un nouveau champ `urlExtractionMode` qui peut prendre les valeurs `regex` ou `query_param`. Valeur par défaut : `regex` (rétrocompatibilité).
- [x] Le schéma `domainRuleSchema` inclut un nouveau champ `urlQueryParamName` (string optionnel, max 64 caractères) qui contient le nom du paramètre à extraire.
- [x] Le champ `urlQueryParamName` doit respecter le pattern `/^[A-Za-z0-9_\-.]+$/` (mêmes caractères qu'un nom de query param HTTP, sans le wildcard `*` qui n'a pas de sens ici).
- [x] Quand `urlExtractionMode = 'query_param'` et que `groupNameSource` implique l'extraction URL (voir US-QP002), `urlQueryParamName` est **obligatoire** et non vide.
- [x] Quand `urlExtractionMode = 'regex'`, `urlParsingRegEx` est obligatoire dans les modes qui le requièrent (comportement actuel inchangé).
- [x] Changer `urlExtractionMode` n'efface pas les valeurs des autres champs (`urlParsingRegEx` et `urlQueryParamName` coexistent dans le formulaire).

### Note d'implémentation

Modifications de `src/schemas/domainRule.ts` et `src/schemas/enums.ts` :

```ts
// enums.ts
export const urlExtractionModeOptions = [
  { value: 'regex', keyLabel: 'urlExtractionModeRegex' },
  { value: 'query_param', keyLabel: 'urlExtractionModeQueryParam' }
] as const;

export type UrlExtractionModeValue = typeof urlExtractionModeOptions[number]['value'];
```

```ts
// domainRule.ts : ajouts dans z.object({...})
urlExtractionMode: z.enum(urlExtractionModeOptions.map(opt => opt.value) as [...]).default('regex'),
urlQueryParamName: z.string().max(64).refine((val) => val === '' || /^[A-Za-z0-9_\-.]+$/.test(val)).optional(),
```

Refine au niveau schéma : `urlQueryParamName` non vide quand `presetId === null`, `urlExtractionMode === 'query_param'` et `groupNameSource` implique l'URL.

---

## US-QP002 — Extraction du nom de groupe depuis un paramètre de requête

**En tant que** service worker de l'extension,
**je veux** extraire le nom de groupe depuis la valeur d'un paramètre de requête de l'URL parente,
**afin de** générer un nom contextuel pour les pages de recherche.

### Critères d'acceptance

- [x] Quand `urlExtractionMode = 'query_param'` et qu'une extraction URL est demandée (modes `url`, `smart`, `smart_label`, `smart_preset`, `smart_manual`), l'extension utilise `URL.searchParams.get(urlQueryParamName)` pour récupérer la valeur.
- [x] La valeur retournée est utilisée **brute, après décodage URL natif** (`URL.searchParams.get` décode automatiquement les `%20`, `+`, etc.).
  - Exemple : `https://google.com/search?q=foo+bar` → nom du groupe = `foo bar`.
  - Exemple : `https://youtube.com/results?search_query=hello%20world` → nom du groupe = `hello world`.
- [x] Aucune transformation supplémentaire n'est appliquée (pas de troncature, pas de capitalisation, pas de premier mot uniquement).
- [x] Si le paramètre est **absent** de l'URL, l'extraction échoue silencieusement et la chaîne de fallback du mode s'applique (cf. US-G015).
- [x] Si le paramètre est **présent mais vide** (`?q=`), l'extraction est considérée comme un échec (chaîne vide non utilisable), et la chaîne de fallback du mode s'applique.
- [x] Si l'URL parente est **invalide** (impossible à parser via `new URL(...)`), l'extension trace un avertissement via `logger.debug` et la chaîne de fallback s'applique.

### Note d'implémentation

Helpers `extractFromQueryParam` et `extractGroupNameFromUrlByMode` ajoutés dans `src/utils/utils.ts`. Tous les call sites URL de `src/background/grouping.ts` passent par le dispatcher.

```ts
export function extractFromQueryParam(url: string | null, paramName: string | null | undefined): string | null {
  if (!url || !paramName) return null;
  try {
    const parsed = new URL(url);
    const value = parsed.searchParams.get(paramName);
    return value && value.length > 0 ? value : null;
  } catch (e) {
    logger.debug('[GROUPING] Invalid URL for query param extraction:', url, e);
    return null;
  }
}
```

---

## US-QP003 — Étape 2 du wizard : choix regex/query param dans le mode Manuel

**En tant qu'** utilisateur configurant une règle en mode Manuel avec source URL,
**je veux** voir un sélecteur compact (regex / query param) qui change le champ affiché,
**afin de** choisir la méthode d'extraction la plus adaptée à mon site sans saturer l'étape du wizard.

### Critères d'acceptance

- [x] Dans le wizard de création/édition (`WizardStep2Config`), en mode **Manuel** avec `groupNameSource = url` (ou un mode `smart*` qui implique l'URL), un `Select` Radix Themes à deux options est affiché : « Regex » et « Paramètre de requête ». Valeur par défaut : `regex`.
- [x] Le `Select` est positionné **au-dessus** du champ d'extraction URL, avec un label « Méthode d'extraction » (clé i18n `urlExtractionModeLabel`).
- [x] Quand « Regex » est sélectionné : le champ `urlParsingRegEx` (TextField multiline existant) est affiché et validé par `createRegexValidator`.
- [x] Quand « Paramètre de requête » est sélectionné : un `TextField` simple est affiché pour `urlQueryParamName`. Placeholder : `q`. Helper text : « Nom du paramètre de requête à extraire (ex : q, search_query, k) ».
- [x] Le champ `urlQueryParamName` est validé en temps réel : caractères autorisés `[A-Za-z0-9_\-.]`, longueur 1 à 64.
- [x] Le `Select` n'apparaît **pas** quand le mode courant n'implique pas d'extraction URL (ex : `groupNameSource = title` strict, `manual`, `ask`).
- [x] Changer la valeur du `Select` ne réinitialise pas la valeur de l'autre champ (les deux coexistent en mémoire formulaire jusqu'à la sauvegarde, seul le champ correspondant au mode actif est validé pour passer à l'étape suivante).
- [x] Sur l'étape de résumé (étape 4), le mode d'extraction et la valeur correspondante sont affichés clairement (ex : « Extraction URL : paramètre `q` » ou « Extraction URL : regex `/issue=(\d+)/` »).

### Note d'implémentation

Composants modifiés : `DomainRuleConfigForm`, `WizardStep2Config`, `WizardStep4Summary`, `RuleWizardModal`, `ConfigEditModal`. Les valeurs `urlParsingRegEx` et `urlQueryParamName` coexistent dans l'état RHF du wizard via `lastManualState` et `lastPresetState`.

---

## US-QP004 — Support des query params dans le système de presets

**En tant qu'** auteur de preset (intégré ou communautaire),
**je veux** pouvoir distribuer des presets qui utilisent l'extraction par query param,
**afin de** couvrir les SERP courantes sans regex complexes.

### Critères d'acceptance

- [x] Le schéma `presetSchema` (`src/types/preset.ts`) accepte deux nouveaux champs optionnels : `urlExtractionMode` (`regex` | `query_param`, défaut `regex`) et `urlQueryParamName` (string, mêmes contraintes que sur `domainRule`).
- [x] Quand `urlExtractionMode = 'query_param'` est défini sur un preset, le champ `urlRegex` doit être absent ou ignoré, et `urlQueryParamName` est **obligatoire**.
- [x] La validation `refine` existante du preset est étendue : `urlExample` reste obligatoire si `urlRegex` OU `urlQueryParamName` est défini, pour documenter un cas concret.
- [x] Quand un utilisateur sélectionne un preset basé sur query param, les champs `urlExtractionMode` et `urlQueryParamName` de la règle sont auto-renseignés depuis le preset (de la même façon que `urlParsingRegEx` l'est aujourd'hui).

### Hors périmètre V1
- L'éditeur de presets dédié et le convertisseur Go ne sont pas mis à jour dans cette PR.

---

## US-QP005 — Presets de SERP intégrés (catégorie « Patterns Génériques »)

**En tant qu'** utilisateur,
**je veux** pouvoir sélectionner directement un preset pour les moteurs de recherche populaires,
**afin de** configurer une règle SERP en un clic sans rien saisir.

### Critères d'acceptance

- [x] **12 nouveaux presets** SERP sont ajoutés à `public/data/presets.json` dans la catégorie existante « Patterns Génériques » (`generic`).
- [x] Chaque preset SERP utilise `urlExtractionMode = 'query_param'` et `groupNameSource = 'smart_label'` (fallback sur le label si le param est manquant).
- [x] Liste des presets inclus :

| Preset | domainFilters | urlQueryParamName |
|---|---|---|
| Google Search | `google.com`, `google.fr`, `google.es` | `q` |
| Bing Search | `bing.com` | `q` |
| DuckDuckGo | `duckduckgo.com` | `q` |
| YouTube Search | `youtube.com` | `search_query` |
| Amazon Search | `amazon.com`, `amazon.fr`, `amazon.es` | `k` |
| eBay Search | `ebay.com`, `ebay.fr` | `_nkw` |
| Stack Overflow Search | `stackoverflow.com` | `q` |
| Reddit Search | `reddit.com` | `q` |
| GitHub Search | `github.com` | `q` |
| npm Search | `npmjs.com` | `q` |
| MDN Search | `developer.mozilla.org` | `q` |
| Wikipedia Search | `wikipedia.org` | `search` |

---

## US-QP006 — Déduplication par valeur de paramètre de requête

> **Hors périmètre V1.** Décision prise pendant l'implémentation : la déduplication n'est pas étendue par cette feature pour limiter le scope de la PR. Pourra être réintroduite dans une itération future.

---

## US-QP007 — Import/Export des règles avec mode query param

**En tant qu'** utilisateur,
**je veux** pouvoir exporter et importer des règles utilisant le mode query param,
**afin de** sauvegarder et partager mes configurations.

### Critères d'acceptance

- [x] Le schéma relâché d'import (`src/schemas/importExport.ts`) accepte les nouveaux champs `urlExtractionMode` et `urlQueryParamName`.
- [x] Lors de l'import d'une règle qui n'a pas le champ `urlExtractionMode` (règle exportée d'une version antérieure), la valeur par défaut `regex` est appliquée silencieusement.
- [x] L'export JSON inclut systématiquement les nouveaux champs (même avec leur valeur par défaut), pour garantir la compatibilité ascendante.

---

## US-QP008 — Migration des règles existantes

**En tant que** développeur,
**je veux** que les règles existantes en stockage local soient migrées sans intervention utilisateur,
**afin de** garantir la rétrocompatibilité après le déploiement de la feature.

### Critères d'acceptance

- [x] La fonction de migration `migrateRulesAddUrlExtractionMode` (`src/background/migration.ts`) ajoute le champ `urlExtractionMode = 'regex'` à toutes les règles existantes qui n'en ont pas.
- [x] La migration est idempotente : exécutée plusieurs fois, elle produit le même résultat (gardée par le flag `urlExtractionModeMigrated` en `storage.local`).
- [x] La migration ne touche pas aux règles qui ont déjà le champ.
- [x] Appelée depuis `setupInstallationHandler` après `migrateSettingsFromSyncToLocal` et avant `initializeDefaults`.
- [x] Tests unitaires Vitest couvrant idempotence, ajout sur règles legacy, absence de domainRules.

---

## Clés i18n ajoutées

Dans `public/_locales/{en,fr,es}/messages.json` :

| Clé | EN | FR | ES |
|---|---|---|---|
| `urlExtractionModeRegex` | Regex | Regex | Regex |
| `urlExtractionModeQueryParam` | Query parameter | Paramètre de requête | Parámetro de consulta |
| `urlExtractionModeLabel` | Extraction method | Méthode d'extraction | Método de extracción |
| `urlQueryParamNameLabel` | Query parameter name | Nom du paramètre | Nombre del parámetro |
| `urlQueryParamNamePlaceholder` | e.g. q | ex : q | ej. q |
| `urlQueryParamNameHelper` | Name of the URL query parameter to extract (e.g. q, search_query, k) | Nom du paramètre de requête à extraire (ex : q, search_query, k) | Nombre del parámetro de consulta a extraer (ej. q, search_query, k) |
| `errorQueryParamNameRequired` | Query parameter name is required | Le nom du paramètre est obligatoire | El nombre del parámetro es obligatorio |
| `errorInvalidQueryParamName` | Invalid parameter name (allowed: letters, digits, _ - .) | Nom de paramètre invalide (autorisés : lettres, chiffres, _ - .) | Nombre de parámetro inválido (permitido: letras, dígitos, _ - .) |
| `urlExtractionSummaryRegex` | URL extraction: regex `{regex}` | Extraction URL : regex `{regex}` | Extracción URL: regex `{regex}` |
| `urlExtractionSummaryQueryParam` | URL extraction: parameter `{param}` | Extraction URL : paramètre `{param}` | Extracción URL: parámetro `{param}` |

---

## Hors périmètre

- Extraction depuis le **fragment** (`#hash`).
- Extraction depuis le **path** segmenté (ex : `/users/:id`) : la regex couvre déjà ce cas.
- Transformation de la valeur extraite (premier mot, troncature, capitalisation) : la valeur brute décodée est utilisée telle quelle.
- Combinaison de plusieurs paramètres dans le nom de groupe : un seul paramètre par règle/preset.
- Extraction par query param côté **titre** (les titres ne sont pas des URL structurées).
- **Déduplication par query param (US-QP006)** : voir note ci-dessus.
