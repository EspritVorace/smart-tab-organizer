# Dashboard Page — Brief

Page à ajouter dans la **page Options** de l'extension SmartTab Organizer
(pas un site marketing, pas la homepage web). Objectif : donner à
l'utilisateur une vue de synthèse qui évite d'avoir à naviguer dans les
autres tabs pour comprendre l'état de son système.

## Intégration architecturale (non négociable)

La page s'ajoute au même niveau que les pages existantes listées dans
`src/pages/options.tsx` :

| id | label (i18n key) | icon | composant |
|---|---|---|---|
| `rules` | `domainRulesTab` | `Shield` | `DomainRulesPage` |
| `sessions` | `sessionsTab` | `Archive` | `SessionsPage` |
| `importexport` | `importExportTab` | `FileText` | `ImportExportPage` |
| `stats` | `statisticsTab` | `BarChart3` | `StatisticsPage` |
| `settings` | `settingsTab` | `Settings` | `SettingsPage` |

La nouvelle entrée est **la première** de la Sidebar :

| id | label (nouvelle clé i18n) | icon | composant |
|---|---|---|---|
| `dashboard` | `dashboardTab` | `LayoutDashboard` (Lucide) | `DashboardPage` |

Contraintes d'intégration :

- Routing hash : `window.location.hash = 'dashboard'`. Déjà géré par
  `useDeepLinking`, il suffit d'ajouter le cas côté `options.tsx`.
- Wrapper obligatoire : `<PageLayout titleKey="dashboardTab"
  descriptionKey="dashboardPageDescription" icon={LayoutDashboard}
  syncSettings={settings}>`. Voir `samples/layout/PageLayout.tsx` dans
  ce pack.
- Accent `indigo` unifié, tokens Radix, pas de couleur hardcodée.
- Toutes les chaînes via `getMessage('key')` (ne PAS hardcoder). Les
  nouvelles clés seront ajoutées dans les 3 locales (EN / FR / ES).
- Composants Radix Themes en priorité (`Card`, `Flex`, `Grid`, `Box`,
  `Heading`, `Text`, `Button`, `IconButton`, `Badge`, `Separator`,
  `Tooltip`).
- Icônes Lucide avec `aria-hidden="true"`. Boutons icon-only ont
  `aria-label` et `title`.

## Contenu de la page Dashboard

L'utilisateur a déjà ces pages ailleurs : Rules, Sessions,
ImportExport, Stats, Settings. Le dashboard **ne remplace pas** ces
pages, il en fait la synthèse et expose des raccourcis.

### Layout proposé (responsive)

Grille en 12 colonnes (Radix `Grid`), qui s'effondre sur mobile.
Mobile : chaque widget prend 12 colonnes. Desktop : compositions
2 / 3 / 4 colonnes selon le widget.

### Widgets (dans l'ordre de lecture)

1. **Welcome / state banner** (12 cols)
   - Si **0 règle configurée** : appel à l'action « Create your first
     rule » qui route vers `#rules`.
   - Si **grouping OU dedup désactivé globalement** : callout
     `color="orange"` avec toggle inline pour réactiver.
   - Sinon : banner sobre `color="gray"` avec un court résumé
     (« 12 rules active, 3 pinned sessions »).

2. **Global toggles** (4 cols × 2)
   - Deux cartes côte à côte avec un Switch Radix : Grouping ON/OFF,
     Deduplication ON/OFF. Labels via i18n. Persistence :
     `useSyncedSettings`.

3. **Statistics summary** (3 cols × 2)
   - Reprendre les deux KPI cards de `StatisticsPage` (Groups created,
     Tabs deduplicated). Même visuel : icône Lucide
     (`Layers`, `Copy`), compteur en `size="8"` `weight="bold"` avec
     `color: var(--accent-11)`, label en `gray`. Pas de bouton reset
     ici : laisser sur la page Stats.
   - Ajouter une 3e carte « Active rules » qui compte
     `settings.domainRules.filter(r => r.enabled).length` si cet état
     est dispo. Si pas dispo, omettre.

4. **Pinned sessions** (12 cols, 1 ou plusieurs lignes)
   - Liste horizontale scrollable des sessions épinglées (composant
     existant côté popup : `PopupProfilesList`, non fourni dans ce pack
     car domain-locked, à reproduire avec les primitives du DS).
   - Chaque item : icône de la session, nom, onglet count, action
     « Restore » (bouton primaire) + menu `DropdownMenu` (Edit, Unpin,
     Delete).
   - Empty state si aucune session épinglée : utiliser `EmptyState` du
     pack (`samples/composed/EmptyState.tsx`) avec message dédié
     (`dashboardPinnedSessionsEmpty`) et bouton « Browse sessions »
     qui route vers `#sessions`.

5. **Recent activity** (6 cols)
   - Liste compacte des 5 dernières sessions créées (tri par
     `createdAt` desc) : nom + date relative + bouton restore.
   - Si données indisponibles ou 0 sessions : `EmptyState` compact.

6. **Quick actions** (6 cols)
   - Grille 2×2 de cartes-boutons : « New rule », « Snapshot current
     window », « Import », « Export ».
   - Chaque carte : icône Lucide, titre, 1 ligne de description,
     action au clic. Route vers la page concernée ou ouvre le wizard
     approprié.

### Interactions clés

- Clic sur une KPI card de stats : scroll / route vers `#stats`.
- Clic sur une session épinglée (zone principale) : lance la
  restauration (wizard si conflit).
- Clic « Snapshot current window » : ouvre le `SnapshotWizard`
  existant (`openSnapshotWizard` dans `useDeepLinking`).

### États à couvrir

| État | Rendu |
|---|---|
| Loading (settings pas encore chargé) | `Spinner size="3"` + `Text` (pattern options.tsx ligne 66) |
| 0 règle, 0 session, toggles off | Welcome state + quick actions seulement |
| Toggles off mais données présentes | Callout orange + widgets normaux |
| Nominal | Welcome banner sobre + tous les widgets |
| Erreur de chargement | `Callout` rouge avec message + bouton retry (hors scope v1 si trop coûteux) |

### Accessibilité

- Un `<h1>` via `Heading as="h1"` dans `PageLayout` (déjà géré).
- Les widgets en `<section aria-labelledby>` avec un `Heading as="h2"`
  visible dans chacun.
- Navigation clavier complète : Tab entre widgets, Enter pour activer
  les quick actions.
- Chaque KPI card annoncée proprement : `aria-label` ou structure
  `<Text>` + `<Text>` suffisante.

### i18n

Nouvelles clés à ajouter dans `public/_locales/{en,fr,es}/messages.json` :

- `dashboardTab`
- `dashboardPageDescription`
- `dashboardWelcomeEmpty`
- `dashboardWelcomeNominal`
- `dashboardTogglesDisabledWarning`
- `dashboardActiveRulesKpi`
- `dashboardPinnedSessionsSection`
- `dashboardPinnedSessionsEmpty`
- `dashboardRecentActivitySection`
- `dashboardQuickActionsSection`
- `dashboardQuickActionNewRule`
- `dashboardQuickActionSnapshot`
- `dashboardQuickActionImport`
- `dashboardQuickActionExport`

Claude Design peut produire la page en EN en utilisant `getMessage`.
La traduction FR / ES se fera dans un deuxième temps.

## Livrables attendus de Claude Design

1. Composant `DashboardPage.tsx` à placer dans `src/pages/`.
2. `DashboardPage.stories.tsx` avec au minimum ces variants :
   `DashboardEmpty`, `DashboardTogglesOff`, `DashboardNominal`,
   `DashboardNoPinnedSessions`.
3. Extraction éventuelle de sous-composants dans
   `src/components/UI/Dashboard/` (KpiCard, QuickActionTile,
   WelcomeBanner) si la décomposition gagne en lisibilité.
4. Diff patch (ou snippet) pour `src/pages/options.tsx` montrant
   l'ajout de l'entrée sidebar et de la route `currentTab ===
   'dashboard'`.
5. Diff partiel pour `public/_locales/en/messages.json` avec les
   nouvelles clés.

## Ce que Claude Design doit éviter

- Inventer des metrics qui n'existent pas dans le type `Statistics`
  (actuellement : `tabGroupsCreatedCount`, `tabsDeduplicatedCount`).
  Si un KPI n'a pas de source de données, le marquer clairement
  `[needs data source]` dans un commentaire et ne pas l'afficher.
- Ajouter une 6e entrée de sidebar autre que Dashboard.
- Ré-implémenter Pinned Sessions from scratch : proposer de réutiliser
  le composant existant `PopupProfilesList` en l'adaptant (le pack ne
  le fournit pas car domain-locked, mais Claude Design peut produire
  une version design-system-aware à base des primitives livrées).
- Dark pattern (notifications modales au load, pop-ups intrusifs).
- Emojis, tirets cadratins, strings hardcodés.

## Références dans le pack

- `samples/layout/PageLayout.tsx` : wrapper de page obligatoire.
- `samples/composed/EmptyState.tsx` : état vide.
- `samples/atomic/StatusBadge.tsx` : badge (réutilisable pour les
  toggles on/off).
- `samples/composition/SessionCard.tsx` : pour inspiration des pinned
  sessions (patterns DnD + HoverCard metadata).
- `samples/form/FormField.tsx` + `FieldError.tsx` + `FieldLabel.tsx` :
  non utilisés directement ici, mais les conventions de composition
  s'appliquent.
- `conventions.md` : règles globales (i18n, a11y, style d'écriture).
- `theme/radix-themes.css` : tokens CSS disponibles.
