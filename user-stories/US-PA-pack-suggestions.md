# User Stories: Domain PA: Onboarding pack suggestions (Parcours d'Accueil)

> Behaviors covered by `tests/utils/packSuggestion.test.ts` and the E2E specs
> written under `tests/e2e/` for issue #433. Decisions recorded in
> `user-stories/pack-suggestions/clarifications.md`.

---

## US-PA001: Pack relevance score from open tabs

**As a** user who just installed the extension,
**I want** the packs matching my actually open tabs to be identified,
**so that** I do not have to guess which of the 49 packs concern me.

### Acceptance criteria

- [ ] A pure function takes the list of open tab URLs and the pack catalog and
      returns the packs sorted by descending score, with the number of matched
      tabs per pack.
- [ ] Matching reuses the existing domain logic (`matchesDomain`), not a
      reimplementation.
- [ ] Non-http(s) URLs (chrome://, about:, extension pages) are ignored.
- [ ] The score is the number of open tabs whose domain matches at least one
      rule of the pack; ties are broken by the number of distinct matched
      domains, then catalog order.
- [ ] Fully installed packs are excluded; `not-installed` and `partial` packs
      stay eligible.
- [ ] No network call, no storage of the analyzed URLs.
- [ ] Vitest coverage: nominal case, no match, threshold, ignored URLs,
      installed/partial packs, distinct-domain tie-break, max truncation,
      wildcard matching.

---

## US-PA002: Contextual hero with suggested packs

**As a** user on the home page with no rule configured,
**I want** to see the packs matching my open tabs, pre-selected,
**so that** I obtain a useful configuration in one click.

### Acceptance criteria

- [ ] When at least one pack passes the threshold (minimum 2 matched tabs,
      maximum 3 packs surfaced), the hero shows the suggested packs with the
      number of matching tabs per pack and a primary CTA "Import and organize".
- [ ] A transparency note states that the analysis is local and that nothing
      leaves the browser.
- [ ] When no pack matches, the current hero is shown unchanged (no
      regression).
- [ ] Suggestions are individually deselectable, reachable by keyboard, with
      states announced to screen readers.
- [ ] No tiny target: each suggestion is activable across its whole surface
      (voice-control constraint).
- [ ] Impersonal register in FR, no em-dash or en-dash; strict FR/EN/ES parity
      via `getMessage()`.
- [ ] Storybook story for the contextual variant (with and without
      suggestions); axe-core audit passing.
- [ ] Dismissing the suggestions is persistent (`browser.storage.local`); the
      contextual hero does not reappear and falls back to the generic hero.

---

## US-PA003: Immediate reward after import

**As a** user who just imported suggested packs,
**I want** to see my tabs organized immediately,
**so that** I experience the value of the extension without waiting for a next
tab.

### Acceptance criteria

- [ ] After the import initiated from the contextual hero, an explicit
      "Organize now" action is offered (no automatic destructive trigger).
- [ ] The action triggers the existing Organize flow on the current window,
      with its existing notifications and undo.
- [ ] The result is announced in an aria-live region.

---

## US-PA004: Relevance ordering in the pack gallery

**As a** user opening the Pack step of the import wizard,
**I want** to see first the packs matching my open tabs,
**so that** I find the useful ones faster.

### Acceptance criteria

- [ ] Matched packs rise to the top of their view, with a "Matches your open
      tabs" indicator (present in FR/EN/ES).
- [ ] The indicator is textual, not only visual (screen reader).
- [ ] Existing search and filters keep working and take priority over the
      ordering.
- [ ] Without a matching tab, the current ordering is preserved.
