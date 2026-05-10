# User Stories: Domain O: Onboarding and contextual help

> Behaviors tested in `tests/e2e/sessions.spec.ts`.

---

## US-O001: Permanent description of the Sessions page

**As a** user visiting the Sessions section,
**I want** to see a short description of the page at the top of the content,
**so that** I understand at all times the role of the Sessions feature.

### Acceptance criteria

- [ ] The page description is visible when the Sessions section is loaded, for every user.
- [ ] The description is rendered in the `data-testid="page-layout-description"` block located between the header and the content.
- [ ] The displayed text corresponds to the i18n key `sessionsPageDescription` in the active locale (EN, FR, or ES).
- [ ] The description remains visible after reload (it is not dismissible and does not use persistence).
