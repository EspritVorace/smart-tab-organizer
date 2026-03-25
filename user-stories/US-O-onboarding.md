# User Stories — Domaine O : Onboarding et aide contextuelle (compléments)

> Comportements testés dans `tests/e2e/onboarding.spec.ts` non couverts par US-O001 existante.
> Les US numérotées ci-dessous reprennent la continuité à partir de US-O002.

---

## US-O002 — Persistance du masquage du callout d'introduction

**En tant qu'** utilisateur ayant déjà lu le callout d'introduction Sessions & Profiles,
**je veux** que le callout reste masqué lors de mes visites suivantes,
**afin de** ne pas être distrait par des informations déjà connues.

### Critères d'acceptation

- [ ] Quand la préférence `sessionsIntroHidden = true` est déjà enregistrée, le callout « Sessions & Profiles » n'est **pas** visible au chargement de la page Sessions.
- [ ] Cliquer le bouton de fermeture (×) sur le callout masque immédiatement le callout.
- [ ] Après fermeture, la préférence `sessionsIntroHidden = true` est persistée dans `chrome.storage.local` (clé `sessionsHelpPrefs`).
- [ ] Après un rechargement de la page Sessions, le callout reste masqué (la préférence est relue depuis le stockage).

---

## US-O003 — Contenu et comportement du dialogue d'onboarding premier profil

**En tant qu'** utilisateur créant son tout premier profil,
**je veux** que le dialogue d'onboarding explique clairement le concept de profil en trois étapes visuelles,
**afin de** comprendre le flux « onglets ouverts → profil sauvegardé → restauration » avant de configurer mon profil.

### Critères d'acceptation

- [ ] Le dialogue d'onboarding affiche le titre « Your First Profile! ».
- [ ] Le diagramme à 3 étapes contient les labels : « Open tabs », « Saved profile », « Restore ».
- [ ] Cliquer « Got it! » ferme le dialogue d'onboarding et ouvre directement le wizard de création de profil (titre « Create Profile » visible).
- [ ] Après avoir cliqué « Got it! », la préférence `profileOnboardingShown = true` est persistée dans `chrome.storage.local`.
- [ ] Lors de la création d'un **deuxième** profil (ou suivant), le dialogue d'onboarding n'apparaît **pas** (`profileOnboardingShown` déjà à `true`); le wizard s'ouvre directement.
- [ ] **Épingler un snapshot** existant comme profil (via le bouton « Pin as Profile ») déclenche également le dialogue d'onboarding si c'est le premier profil de l'utilisateur.

---

## US-O004 — Accessibilité des tooltips d'aide

**En tant qu'** utilisateur ayant des besoins d'accessibilité ou souhaitant plus d'informations,
**je veux** que les boutons d'aide et d'action exposent leurs tooltips de façon accessible,
**afin de** pouvoir consulter les explications sans interaction de survol complexe.

### Critères d'acceptation

- [ ] Le bouton « New Profile » dans l'en-tête affiche un tooltip au survol de la souris (`role="tooltip"` visible).
