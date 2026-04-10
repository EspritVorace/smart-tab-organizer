# Firefox QA Checklist

Smoke-test manuel à exécuter avant chaque release Firefox, tant qu'on n'a pas de suite E2E Firefox automatisée (voir [wxt-dev/wxt#1699](https://github.com/wxt-dev/wxt/issues/1699)).

## Prérequis

- Firefox ≥ 139 (requis pour `browser.tabGroups`)
- `pnpm build:firefox` puis charger `.output/firefox-mv2` via `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on…" → sélectionner `manifest.json`
- Ou `pnpm dev:firefox` pour l'auto-reload

## 1. Storage & bootstrap

- [ ] Aucune erreur `The storage API will not work with a temporary addon ID` dans la console Firefox (regression gecko ID — voir `wxt.config.ts`)
- [ ] Aucune erreur `[useSyncedState] load error` au démarrage
- [ ] Ouvrir Options → tous les toggles chargent leur état par défaut sans erreur console

## 2. Sessions — Sauvegarde

- [ ] Ouvrir 3-4 onglets réels (ex: github.com, mdn.dev, news.ycombinator.com)
- [ ] Clic sur le bouton Snapshot du popup → wizard s'ouvre
- [ ] **La page Options SmartTab n'apparaît PAS dans la liste des onglets sélectionnables** (regression `moz-extension://` — voir `tabCapture.ts`)
- [ ] Saisir un nom, sauvegarder → notification de succès
- [ ] Rouvrir Options → onglet Sessions → la session apparaît avec le bon nombre d'onglets
- [ ] Recharger l'extension (ou Firefox) → la session est toujours là

## 3. Sessions — Épinglage & popup

- [ ] Épingler une session depuis la carte → icône change
- [ ] Ouvrir le popup → section "Sessions épinglées" visible avec la session
- [ ] Clic restore (current window) → les onglets s'ouvrent dans la fenêtre courante
- [ ] Clic restore (new window) → nouvelle fenêtre avec les onglets
- [ ] Désépingler → la section disparaît du popup si plus aucune session épinglée

## 4. Sessions — Édition

- [ ] Éditer une session → dialog s'ouvre, tree view fonctionnel
- [ ] Renommer un groupe, changer la couleur → sauvegarder → changements persistés
- [ ] Désélectionner un onglet, sauvegarder → l'onglet disparaît de la session
- [ ] Annuler une édition → aucun changement appliqué

## 5. Grouping (Firefox 139+)

- [ ] Ajouter une domain rule (ex: `github.com`, label "GitHub")
- [ ] Ouvrir un onglet github.com → middle-click sur un lien interne
- [ ] Vérifier que le nouvel onglet est groupé avec le label "GitHub"
- [ ] Tester les 4 `groupNameSource` : label, title, url, smart
- [ ] Vérifier qu'une couleur custom dans la rule est bien appliquée
- [ ] Regex preset : tester au moins un preset builtin (ex: JIRA)

## 6. Déduplication

- [ ] Activer la dedup globale + ajouter une rule avec `deduplicationEnabled: true`
- [ ] Ouvrir 2 fois la même URL → le doublon doit se fermer et focus passer sur l'original
- [ ] Tester les 4 modes : `exact`, `hostname+path`, `hostname`, `includes`
- [ ] Vérifier la notification de dedup (si activée dans settings)

## 7. Domain Rules CRUD

- [ ] Créer une rule → champs remplis, sauvegarde → apparaît dans la liste
- [ ] Éditer une rule existante → modifs persistées
- [ ] Toggle enabled/disabled → icône et comportement cohérents
- [ ] Drag-and-drop pour réordonner → ordre conservé au reload
- [ ] Supprimer une rule → confirm dialog → disparaît

## 8. Import / Export

- [ ] Export rules → fichier JSON téléchargé, contenu valide
- [ ] Import du même fichier → wizard détecte "identical" pour toutes les rules
- [ ] Import d'un fichier modifié → détection new/conflicting correcte
- [ ] Résolution de conflits → options `keep/replace/skip` fonctionnent

## 9. Statistics

- [ ] Les compteurs grouping et dedup s'incrémentent pendant les tests ci-dessus
- [ ] Reset statistics → compteurs reviennent à 0

## 10. UI transverse

- [ ] Sidebar navigation entre Domain Rules / Sessions / Statistics / Settings / Import-Export
- [ ] Theme toggle light/dark fonctionne
- [ ] Tester les 3 locales : EN, FR, ES (changer la langue Firefox ou inspecter les strings)
- [ ] Popup s'affiche correctement (taille, pas de scroll horizontal)
- [ ] Options s'affiche correctement en mobile-width (responsive)

## 11. Console

- [ ] Aucune erreur rouge dans la console du background page
- [ ] Aucune erreur rouge dans la console de la page Options
- [ ] Aucune erreur rouge dans la console du popup
- [ ] Les `logger.debug` sont présents en dev mais absents en build production

## Connu / Non testable automatiquement

- Le bug `moz-extension://` dans `tabCapture.ts` (#bug-scope-du-QA) — corrigé, à vérifier à chaque release
- `browser.tabGroups` est supporté depuis Firefox 139 uniquement. Documenter dans le README la version min.
