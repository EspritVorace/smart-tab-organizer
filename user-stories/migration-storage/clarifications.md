# Migration storage.sync -> storage.local : decisions

## Contexte

Migration de tous les parametres applicatifs (domainRules, toggles, prefs notifications)
de `browser.storage.sync` vers `browser.storage.local`.

## Decisions

**D1 - Suppression des donnees sync apres migration**
Decision : ne pas supprimer les cles `storage.sync` apres migration.
Raison : permettre un rollback manuel sans perte de donnees si l'utilisateur
revient a une version anterieure de l'extension.

**D2 - Idempotence de la migration**
Decision : la migration est protegeee par un flag `settingsMigratedToLocal`
dans `storage.local`. Elle ne s'execute qu'une seule fois, meme si
`onInstalled` se declenche plusieurs fois (mises a jour).

**D3 - Priorite des donnees en cas de conflit**
Decision : si une cle existe deja dans `storage.local`, les donnees sync
ne la remplacent pas (local a la priorite).
Raison : eviter d'ecraser un etat plus recent avec un etat sync potentiellement
obsolete (ex. : utilisateur qui a modifie ses regles apres installation).

**D4 - auto-sync des profils**
La feature "auto-sync" des profils epingles n'est pas implementee.
La mention dans CLAUDE.md etait une documentation obsolete : supprimee.

**D5 - storage.session**
Apres audit du code, `storage.session` est utilise uniquement pour des
etats ephemeres (map profil-fenetre, guards d'edition). Il n'est pas
migre : il reste inchange.

**D6 - Nommage des hooks**
`useSyncedSettings` renomme en `useSettings`.
`useSyncedState` renomme en `useStorageState`.
Pas de periode de deprecation : remplacement direct dans tous les consommateurs.

**D7 - Quota sync**
Le quota sync (100 Ko total, 8 Ko/item, 120 ecritures/min) etait la source
de fragilite des tests E2E (retries avec backoff dans `syncSet()`).
Apres migration vers local, le helper `syncSet` est remplace par `localSet`
sans logique de retry.
