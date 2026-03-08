# User Stories — Domaine AS : Synchronisation automatique des profils (background)

> Comportements testés dans `tests/e2e/auto-sync.spec.ts` non couverts par les US existantes (US-S001→S008, US-E001→E002, US-P001→P004, US-PO001→PO002, US-W001, US-O001).
> Ces US couvrent le comportement **background** de l'auto-sync (alarmes, drafts en mémoire de session, garde du dialogue d'édition), distincts des US-P003/P004 qui couvrent l'interface utilisateur du toggle.

---

## US-AS001 — Cycle de vie de l'alarme périodique

**En tant que** service worker de l'extension,
**je veux** créer et supprimer l'alarme périodique `auto-sync-profiles` en fonction de l'état des profils,
**afin de** capturer régulièrement les onglets ouverts uniquement quand au moins un profil a l'auto-sync activé.

### Critères d'acceptation

- [ ] Quand l'auto-sync est **activé** sur un profil via le toggle de l'interface, l'alarme `auto-sync-profiles` est créée dans `chrome.alarms` (période de 5 minutes).
- [ ] Quand l'auto-sync est **désactivé** sur le **dernier** profil qui l'avait activé, l'alarme `auto-sync-profiles` est supprimée de `chrome.alarms`.
- [ ] Quand aucun profil n'a l'auto-sync activé, l'alarme n'est **pas** créée (même après une modification du stockage).

---

## US-AS002 — Stockage temporaire des drafts de synchronisation

**En tant que** service worker de l'extension,
**je veux** stocker les captures d'onglets en cours (drafts) dans `chrome.storage.session`,
**afin de** ne pas écraser le profil sauvegardé avant qu'une fenêtre de profil ne soit fermée.

### Critères d'acceptation

- [ ] Un draft de synchronisation est écrit dans `chrome.storage.session` (clé `profileSyncDrafts`), et **non** dans `chrome.storage.local`, lors d'une capture périodique.
- [ ] Tant que le draft n'a pas été persisté, le profil dans `chrome.storage.local` conserve ses anciennes données (le draft n'est pas visible dans le profil sauvegardé).
- [ ] Après la **persistence** du draft (ex. : déclenchée par la fermeture de la fenêtre de profil), le contenu du profil dans `chrome.storage.local` est mis à jour avec les données du draft.
- [ ] Après persistence, le draft est **supprimé** de `chrome.storage.session` (la clé du profil dans `profileSyncDrafts` est effacée).

---

## US-AS003 — Garde du dialogue d'édition (protection contre l'écrasement)

**En tant que** service worker de l'extension,
**je veux** savoir quand un profil est en cours d'édition par l'utilisateur,
**afin d'** éviter qu'une synchronisation automatique n'écrase les modifications non sauvegardées.

### Critères d'acceptation

- [ ] Quand le dialogue d'édition d'un profil est **ouvert**, l'identifiant du profil (`profileId`) est écrit dans `chrome.storage.session` sous la clé `editingProfileId`.
- [ ] Quand le dialogue d'édition est **fermé** (par le bouton Annuler ou Sauvegarder), la valeur de `editingProfileId` dans `chrome.storage.session` est remise à `null`.
