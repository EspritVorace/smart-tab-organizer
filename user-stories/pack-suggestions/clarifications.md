# Clarifications - Onboarding pack suggestions (issue #433)

Decisions validated with the product owner before implementation. The user
stories (`user-stories/US-PA-pack-suggestions.md`) are immutable once validated:
code and tests adapt to them, never the other way around.

## Decisions

1. **US numbering**: no `PA` domain existed. We create the `PA` domain (Parcours
   d'Accueil), stories US-PA001..US-PA004.

2. **Score algorithm**: score = number of open tabs whose domain matches at
   least one rule of the pack. Tie-break: number of distinct matched domains,
   then catalog order (the order produced by `usePacks`).

3. **Thresholds**: minimum 2 matched tabs for a pack to be suggested; maximum 3
   packs surfaced in the hero (`DEFAULT_SUGGESTION_MIN_TABS`,
   `DEFAULT_SUGGESTION_MAX` in `src/utils/packSuggestion.ts`).

4. **Configurable packs (CONFIG)**: included in the suggestions. They are
   pre-selected with their default params (`param.default`) resolved through
   `resolvePackRules`, and remain adjustable in the wizard Pack step.

5. **Installed packs**: fully installed packs (`status === 'installed'`) are
   excluded from the suggestions; `not-installed` and `partial` stay eligible.

6. **Analyzed tab scope**: all normal windows. Private/incognito windows are
   excluded (`tab.incognito`), non-http(s) URLs are ignored, pinned tabs are
   included.

7. **Post-import organize**: explicit "Organize now" button, never an automatic
   destructive trigger.

8. **Contextual hero display condition**: only in the onboarding state (zero
   rule in the active workspace) AND at least one pack above the threshold. The
   dismissal is persistent (`browser.storage.local`), falling back to the
   generic hero. Fallback also applies when there is no match.

9. **Workspaces**: scoring and install status are computed in the active
   workspace context (the `domainRules` exposed by `useSettings` / `syncSettings`
   are already scoped to the active workspace).

10. **Architecture layer**: the scoring engine is a pure utility in
    `src/utils/packSuggestion.ts` (consistent with `packInstallStatus.ts` and
    `packResolution.ts`). The `browser.tabs` query lives in a hook
    (`usePackSuggestions`).

11. **Hero CTA plumbing**: because configurable packs are included, the hero CTA
    goes through the import wizard (not a direct import bypass). `usePackSelections`
    is extended with an initial pre-selection, and the hero opens `ImportWizard`
    in `pack` mode with the suggested packs pre-checked.
