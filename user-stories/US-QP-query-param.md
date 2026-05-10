# User Stories - Domain QP: Extraction by URL query parameter

> Implemented in PR #177. **US-QP006 (deduplication by query param) is out of scope for V1**, deduplication is not modified by this feature.

## Context

Today, extracting the group name from a URL goes through a regular expression (`urlParsingRegEx`) without exception. For search pages (Google, YouTube, Amazon, Stack Overflow, etc.), it is overkill: the data sought is always the value of a query parameter (`?q=foo`, `?search_query=bar`, `?k=baz`).

This feature introduces an alternative extraction mode based on the name of a query parameter, which is simpler, more robust, and well suited to 90% of SERPs. The user picks between `regex` and `query param` when configuring URL extraction.

**Usage examples:**

| Site | Parameter |
|---|---|
| Google, Bing, DuckDuckGo, Stack Overflow, Reddit, GitHub, npm, MDN | `q` |
| YouTube | `search_query` |
| Amazon | `k` |
| eBay | `_nkw` |
| Wikipedia (Special:Search) | `search` |

---

## US-QP001 - Choice between regex and query param for URL extraction

**As a** user configuring a domain rule,
**I want** to choose between a regular expression and a query parameter name as the URL extraction method,
**so that** I can quickly configure rules for search pages without writing a regex.

### Acceptance criteria

- [x] The `domainRuleSchema` includes a new `urlExtractionMode` field which can take the values `regex` or `query_param`. Default value: `regex` (backward compatibility).
- [x] The `domainRuleSchema` includes a new `urlQueryParamName` field (optional string, max 64 characters) containing the name of the parameter to extract.
- [x] The `urlQueryParamName` field must match the pattern `/^[A-Za-z0-9_\-.]+$/` (same characters as an HTTP query param name, without the wildcard `*` which has no meaning here).
- [x] When `urlExtractionMode = 'query_param'` and `groupNameSource` implies URL extraction (see US-QP002), `urlQueryParamName` is **required** and non-empty.
- [x] When `urlExtractionMode = 'regex'`, `urlParsingRegEx` is required in the modes that need it (current behavior unchanged).
- [x] Changing `urlExtractionMode` does not erase the values of the other fields (`urlParsingRegEx` and `urlQueryParamName` coexist in the form).

### Implementation note

Changes in `src/schemas/domainRule.ts` and `src/schemas/enums.ts`:

```ts
// enums.ts
export const urlExtractionModeOptions = [
  { value: 'regex', keyLabel: 'urlExtractionModeRegex' },
  { value: 'query_param', keyLabel: 'urlExtractionModeQueryParam' }
] as const;

export type UrlExtractionModeValue = typeof urlExtractionModeOptions[number]['value'];
```

```ts
// domainRule.ts: additions inside z.object({...})
urlExtractionMode: z.enum(urlExtractionModeOptions.map(opt => opt.value) as [...]).default('regex'),
urlQueryParamName: z.string().max(64).refine((val) => val === '' || /^[A-Za-z0-9_\-.]+$/.test(val)).optional(),
```

Schema-level refine: `urlQueryParamName` non-empty when `presetId === null`, `urlExtractionMode === 'query_param'`, and `groupNameSource` implies the URL.

---

## US-QP002 - Extraction of the group name from a query parameter

**As the** extension service worker,
**I want** to extract the group name from the value of a query parameter of the parent URL,
**so that** I can generate a contextual name for search pages.

### Acceptance criteria

- [x] When `urlExtractionMode = 'query_param'` and a URL extraction is required (modes `url`, `smart`, `smart_label`, `smart_preset`, `smart_manual`), the extension uses `URL.searchParams.get(urlQueryParamName)` to retrieve the value.
- [x] The returned value is used **raw, after native URL decoding** (`URL.searchParams.get` automatically decodes `%20`, `+`, etc.).
  - Example: `https://google.com/search?q=foo+bar` -> group name = `foo bar`.
  - Example: `https://youtube.com/results?search_query=hello%20world` -> group name = `hello world`.
- [x] No further transformation is applied (no truncation, no capitalization, no first-word-only).
- [x] If the parameter is **missing** from the URL, the extraction silently fails and the mode's fallback chain applies (cf. US-G015).
- [x] If the parameter is **present but empty** (`?q=`), the extraction is considered a failure (unusable empty string), and the mode's fallback chain applies.
- [x] If the parent URL is **invalid** (cannot be parsed via `new URL(...)`), the extension logs a warning via `logger.debug` and the fallback chain applies.

### Implementation note

Helpers `extractFromQueryParam` and `extractGroupNameFromUrlByMode` added in `src/utils/utils.ts`. All URL call sites of `src/background/grouping.ts` go through the dispatcher.

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

## US-QP003 - Wizard step 2: regex/query param choice in Manual mode

**As a** user configuring a rule in Manual mode with URL source,
**I want** to see a compact selector (regex / query param) that switches the displayed field,
**so that** I can pick the extraction method best suited to my site without overcrowding the wizard step.

### Acceptance criteria

- [x] In the create/edit wizard (`WizardStep2Config`), in **Manual** mode with `groupNameSource = url` (or a `smart*` mode that involves the URL), a Radix Themes `Select` with two options is shown: "Regex" and "Query parameter". Default value: `regex`.
- [x] The `Select` is positioned **above** the URL extraction field, with a label "Extraction method" (i18n key `urlExtractionModeLabel`).
- [x] When "Regex" is selected: the `urlParsingRegEx` field (existing multiline TextField) is shown and validated by `createRegexValidator`.
- [x] When "Query parameter" is selected: a simple `TextField` is shown for `urlQueryParamName`. Placeholder: `q`. Helper text: "Name of the query parameter to extract (e.g. q, search_query, k)".
- [x] The `urlQueryParamName` field is validated in real time: allowed characters `[A-Za-z0-9_\-.]`, length 1 to 64.
- [x] The `Select` does **not** appear when the current mode does not involve URL extraction (e.g. `groupNameSource = title` strict, `manual`, `ask`).
- [x] Changing the value of the `Select` does not reset the value of the other field (both coexist in the form memory until save; only the field corresponding to the active mode is validated to move to the next step).
- [x] On the summary step (step 4), the extraction mode and the corresponding value are clearly shown (e.g. "URL extraction: parameter `q`" or "URL extraction: regex `/issue=(\d+)/`").

### Implementation note

Modified components: `DomainRuleConfigForm`, `WizardStep2Config`, `WizardStep4Summary`, `RuleWizardModal`, `ConfigEditModal`. The `urlParsingRegEx` and `urlQueryParamName` values coexist in the wizard's RHF state via `lastManualState` and `lastPresetState`.

---

## US-QP004 - Query param support in the preset system

**As a** preset author (built-in or community),
**I want** to be able to distribute presets that use query param extraction,
**so that** I can cover common SERPs without complex regexes.

### Acceptance criteria

- [x] The `presetSchema` (`src/types/preset.ts`) accepts two new optional fields: `urlExtractionMode` (`regex` | `query_param`, default `regex`) and `urlQueryParamName` (string, same constraints as on `domainRule`).
- [x] When `urlExtractionMode = 'query_param'` is set on a preset, the `urlRegex` field must be absent or ignored, and `urlQueryParamName` is **required**.
- [x] The preset's existing `refine` validation is extended: `urlExample` remains required if `urlRegex` OR `urlQueryParamName` is set, in order to document a concrete case.
- [x] When a user selects a preset based on a query param, the rule's `urlExtractionMode` and `urlQueryParamName` fields are auto-filled from the preset (the same way `urlParsingRegEx` is today).

### Out of scope V1
- The dedicated preset editor and the Go converter are not updated in this PR.

---

## US-QP005 - Built-in SERP presets (category "Generic Patterns")

**As a** user,
**I want** to be able to directly select a preset for popular search engines,
**so that** I can configure a SERP rule in one click without typing anything.

### Acceptance criteria

- [x] **12 new** SERP presets are added to `public/data/presets.json` in the existing "Generic Patterns" (`generic`) category.
- [x] Each SERP preset uses `urlExtractionMode = 'query_param'` and `groupNameSource = 'smart_label'` (fallback to the label if the param is missing).
- [x] List of included presets:

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

## US-QP006 - Deduplication by query parameter value

> **Out of scope V1.** Decision taken during implementation: deduplication is not extended by this feature in order to limit the scope of the PR. May be reintroduced in a future iteration.

---

## US-QP007 - Import/Export of rules with query param mode

**As a** user,
**I want** to be able to export and import rules using the query param mode,
**so that** I can save and share my configurations.

### Acceptance criteria

- [x] The relaxed import schema (`src/schemas/importExport.ts`) accepts the new `urlExtractionMode` and `urlQueryParamName` fields.
- [x] When importing a rule that does not have the `urlExtractionMode` field (rule exported from a previous version), the default value `regex` is applied silently.
- [x] The JSON export systematically includes the new fields (even with their default value), to ensure forward compatibility.

---

## US-QP008 - Migration of existing rules

**As a** developer,
**I want** existing rules in local storage to be migrated without user intervention,
**so that** backward compatibility is guaranteed after the feature is deployed.

### Acceptance criteria

- [x] The migration function `migrateRulesAddUrlExtractionMode` (`src/background/migration.ts`) adds the field `urlExtractionMode = 'regex'` to all existing rules that do not have it.
- [x] The migration is idempotent: run multiple times, it produces the same result (guarded by the `urlExtractionModeMigrated` flag in `storage.local`).
- [x] The migration does not touch rules that already have the field.
- [x] Called from `setupInstallationHandler` after `migrateSettingsFromSyncToLocal` and before `initializeDefaults`.
- [x] Vitest unit tests covering idempotence, addition on legacy rules, absence of domainRules.

---

## i18n keys added

In `public/_locales/{en,fr,es}/messages.json`:

| Key | EN | FR (i18n value) | ES (i18n value) |
|---|---|---|---|
| `urlExtractionModeRegex` | Regex | Regex | Regex |
| `urlExtractionModeQueryParam` | Query parameter | Parametre de requete | Parametro de consulta |
| `urlExtractionModeLabel` | Extraction method | Methode d'extraction | Metodo de extraccion |
| `urlQueryParamNameLabel` | Query parameter name | Nom du parametre | Nombre del parametro |
| `urlQueryParamNamePlaceholder` | e.g. q | ex : q | ej. q |
| `urlQueryParamNameHelper` | Name of the URL query parameter to extract (e.g. q, search_query, k) | Nom du parametre de requete a extraire (ex : q, search_query, k) | Nombre del parametro de consulta a extraer (ej. q, search_query, k) |
| `errorQueryParamNameRequired` | Query parameter name is required | Le nom du parametre est obligatoire | El nombre del parametro es obligatorio |
| `errorInvalidQueryParamName` | Invalid parameter name (allowed: letters, digits, _ - .) | Nom de parametre invalide (autorises : lettres, chiffres, _ - .) | Nombre de parametro invalido (permitido: letras, digitos, _ - .) |
| `urlExtractionSummaryRegex` | URL extraction: regex `{regex}` | Extraction URL : regex `{regex}` | Extraccion URL: regex `{regex}` |
| `urlExtractionSummaryQueryParam` | URL extraction: parameter `{param}` | Extraction URL : parametre `{param}` | Extraccion URL: parametro `{param}` |

---

## Out of scope

- Extraction from the **fragment** (`#hash`).
- Extraction from the segmented **path** (e.g. `/users/:id`): the regex already covers this case.
- Transformation of the extracted value (first word, truncation, capitalization): the raw decoded value is used as-is.
- Combination of multiple parameters in the group name: only one parameter per rule/preset.
- Query param extraction on the **title** side (titles are not structured URLs).
- **Deduplication by query param (US-QP006)**: see note above.
