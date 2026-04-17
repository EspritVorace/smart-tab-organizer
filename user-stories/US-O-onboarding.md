# User Stories : Domaine O : Onboarding et aide contextuelle

> Comportements testés dans `tests/e2e/sessions.spec.ts`.

---

## US-O001 : Description permanente de la page Sessions

**En tant qu'** utilisateur visitant la section Sessions,
**je veux** voir une description courte de la page en haut du contenu,
**afin de** comprendre à tout moment le rôle de la fonctionnalité Sessions.

### Critères d'acceptation

- [ ] La description de page est visible au chargement de la section Sessions, pour tout utilisateur.
- [ ] La description est rendue dans le bloc `data-testid="page-layout-description"` situé entre le header et le contenu.
- [ ] Le texte affiché correspond à la clé i18n `sessionsPageDescription` dans la locale active (EN, FR ou ES).
- [ ] La description reste visible après rechargement (elle n'est pas dismissible et n'utilise pas de persistance).
