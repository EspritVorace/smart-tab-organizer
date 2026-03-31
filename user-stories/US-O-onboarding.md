# User Stories — Domaine O : Onboarding et aide contextuelle

> Comportements testés dans `tests/e2e/sessions.spec.ts`.

---

## US-O001 — Affichage du callout d'introduction Sessions

**En tant qu'** utilisateur visitant la section Sessions pour la première fois,
**je veux** voir un callout d'introduction explicatif,
**afin de** comprendre comment fonctionne la fonctionnalité Sessions.

### Critères d'acceptation

- [ ] Le callout d'introduction « Sessions » est visible au chargement de la page Sessions pour un nouvel utilisateur.

---

## US-O002 — Persistance du masquage du callout d'introduction

**En tant qu'** utilisateur ayant déjà lu le callout d'introduction Sessions,
**je veux** que le callout reste masqué lors de mes visites suivantes,
**afin de** ne pas être distrait par des informations déjà connues.

### Critères d'acceptation

- [ ] Quand la préférence `sessionsIntroHidden = true` est déjà enregistrée, le callout « Sessions » n'est **pas** visible au chargement de la page Sessions.
- [ ] Cliquer le bouton de fermeture (×) sur le callout masque immédiatement le callout.
- [ ] Après fermeture, la préférence `sessionsIntroHidden = true` est persistée dans `chrome.storage.local` (clé `sessionsHelpPrefs`).
- [ ] Après un rechargement de la page Sessions, le callout reste masqué (la préférence est relue depuis le stockage).
