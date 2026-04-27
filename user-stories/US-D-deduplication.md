# User Stories — Domaine D : Déduplication automatique d'onglets

> Comportements testés dans `tests/e2e/deduplication.spec.ts` non couverts par les US existantes (US-S001→S008, US-E001→E002, US-P001→P004, US-PO001→PO002, US-W001, US-O001).

---

## US-D001 — Activation globale de la déduplication

**En tant qu'** utilisateur de l'extension,
**je veux** pouvoir activer ou désactiver la déduplication automatique de façon globale,
**afin de** contrôler si les onglets en double sont fermés automatiquement.

### Critères d'acceptation

- [ ] Quand la déduplication globale est **activée**, ouvrir un onglet avec une URL déjà ouverte conserve un seul onglet selon la stratégie configurée (voir US-D009) et ferme l'autre.
- [ ] Quand la déduplication globale est **désactivée**, les onglets en double sont conservés; `tabsDeduplicatedCount` reste à 0.
- [ ] Deux onglets avec des **URLs différentes** ne sont jamais dédupliqués, même si la déduplication globale est activée.
- [ ] Le compteur `tabsDeduplicatedCount` s'incrémente uniquement quand une déduplication a lieu.

---

## US-D002 — Paramètres de déduplication par règle

**En tant qu'** utilisateur,
**je veux** que chaque règle de domaine puisse activer ou désactiver la déduplication indépendamment du paramètre global,
**afin de** gérer finement les domaines où les doublons sont souhaitables.

### Critères d'acceptation

- [ ] Quand une règle a `deduplicationEnabled = true`, les onglets en double du domaine correspondant sont supprimés.
- [ ] Quand une règle a `deduplicationEnabled = false`, les doublons du domaine correspondant sont conservés, même si le global est activé.
- [ ] Quand une règle est **désactivée** (`enabled = false`), elle est ignorée et le paramètre global s'applique à ce domaine.

---

## US-D003 — Mode de correspondance : exact

**En tant qu'** utilisateur,
**je veux** pouvoir configurer la déduplication en mode « exact »,
**afin de** ne fermer un onglet que s'il pointe vers exactement la même URL.

### Critères d'acceptation

- [ ] En mode `exact`, deux URLs identiques (même protocole, domaine, chemin, query string, fragment) sont considérées comme doublons et l'une est fermée.
- [ ] En mode `exact`, deux URLs qui diffèrent **uniquement par le query string** (`?param=a` vs `?param=b`) sont considérées comme distinctes et conservées.
- [ ] En mode `exact`, deux URLs qui diffèrent **uniquement par le fragment** (`#section1` vs `#section2`) sont considérées comme distinctes et conservées.
- [ ] Un onglet avec le même fragment qu'un onglet existant est correctement dédupliqué (`#section1` vs `#section1`).

---

## US-D004 — Mode de correspondance : includes

**En tant qu'** utilisateur,
**je veux** pouvoir configurer la déduplication en mode « includes »,
**afin de** fermer un onglet si son URL est contenue dans une URL déjà ouverte (ou vice-versa).

### Critères d'acceptation

- [ ] En mode `includes`, si l'URL du nouvel onglet est une **sous-chaîne** de l'URL d'un onglet existant, le nouvel onglet est considéré comme doublon et fermé.
  - Exemple : `/products/item` est contenu dans `/products/item/123` → dédupliqué.
- [ ] En mode `includes`, deux URLs sans relation de sous-chaîne (ex. `/products` et `/about`) ne sont **pas** dédupliquées.

---

## US-D005 — Règles multiples et domaines sans règle

**En tant qu'** utilisateur,
**je veux** que chaque domaine suive sa propre règle de déduplication,
**afin de** maintenir des comportements différenciés selon les sites.

### Critères d'acceptation

- [ ] Un domaine avec une règle `deduplicationEnabled = true` voit ses doublons supprimés.
- [ ] Un domaine avec une règle `deduplicationEnabled = false` conserve ses doublons, même si le global est activé.
- [ ] Un domaine **sans règle** suit le paramètre `deduplicateUnmatchedDomains` tant que la déduplication globale est activée (voir US-D008).

---

## US-D006 — Cas limites de la déduplication

**En tant que** développeur de l'extension,
**je veux** que la déduplication soit robuste face aux cas limites,
**afin de** garantir la stabilité de l'extension dans tous les scénarios.

### Critères d'acceptation

- [ ] Les onglets avec des schémas spéciaux (`about:`, `chrome:`, `chrome-extension:`) ne provoquent pas de crash et sont ignorés par la déduplication.
- [ ] Quand plusieurs onglets en double sont créés rapidement en parallèle, au moins quelques-uns sont dédupliqués (`tabsDeduplicatedCount > 0`).
- [ ] Un filtre de domaine ciblant un sous-domaine (ex. `www.example.com`) matche correctement les URLs de ce sous-domaine.

---

## US-D007 — Statistiques de déduplication

**En tant qu'** utilisateur,
**je veux** que le compteur de déduplications reflète précisément le nombre d'onglets fermés,
**afin de** mesurer l'utilité de la fonctionnalité.

### Critères d'acceptation

- [ ] `tabsDeduplicatedCount` commence à 0 après une réinitialisation des statistiques.
- [ ] Le compteur s'incrémente de **1** exactement à chaque fermeture d'un onglet doublon.
- [ ] Après deux déduplications successives pour la même URL, le compteur vaut 2.

---

## US-D008 — Portée de la déduplication pour les domaines sans règle

**En tant qu'** utilisateur,
**je veux** choisir depuis la page Options si la déduplication automatique s'applique aux onglets des sites qui ne correspondent à aucune règle de domaine,
**afin de** limiter la déduplication aux seuls domaines que j'ai explicitement configurés.

### Critères d'acceptation

- [ ] Un paramètre `deduplicateUnmatchedDomains` (booléen) est exposé dans la page Options, dans une section dédiée à la portée de la déduplication.
- [ ] La valeur par défaut est `false` : les domaines sans règle ne sont pas dédupliqués automatiquement tant que l'utilisateur n'active pas le paramètre.
- [ ] Quand `deduplicateUnmatchedDomains = false` et que la déduplication globale est activée, les onglets d'un domaine sans règle **ne sont pas** dédupliqués; `tabsDeduplicatedCount` reste inchangé pour ces URLs.
- [ ] Quand `deduplicateUnmatchedDomains = false`, une règle de domaine avec `deduplicationEnabled = true` continue de dédupliquer ses onglets (la règle prévaut).
- [ ] Quand la déduplication globale est désactivée, le paramètre `deduplicateUnmatchedDomains` n'a aucun effet (le kill-switch global reste prioritaire).
- [ ] Le libellé UI précise la portée: s'applique uniquement aux sites sans règle de domaine, et les règles restent prioritaires.

---

## US-D009 — Stratégie "quel onglet garder lors d'une déduplication"

**En tant qu'** utilisateur,
**je veux** choisir quel onglet survit lorsqu'un doublon est détecté,
**afin de** préserver l'état ou l'appartenance à un groupe selon mes besoins.

### Contexte

Historiquement, la déduplication gardait toujours l'onglet existant (le plus ancien) et fermait le nouvel onglet. Ce comportement pose problème lors d'une restauration de session : si la session sauvegardée contient un onglet **groupé** à l'URL X et qu'un onglet **non groupé** est déjà ouvert à cette URL, c'est le tab non groupé qui survit et l'appartenance au groupe restauré est perdue.

### Critères d'acceptation

- [ ] Un paramètre `deduplicationKeepStrategy` est exposé dans la page Options, section "Portée de la déduplication", sous forme de radio à quatre valeurs :
  - `keep-old` : conserver l'onglet existant.
  - `keep-new` : conserver le nouvel onglet et fermer l'existant.
  - `keep-grouped` : conserver celui qui est dans un groupe, sinon retomber sur `keep-old`.
  - `keep-grouped-or-new` : conserver celui qui est dans un groupe, sinon retomber sur `keep-new`.
- [ ] La valeur par défaut est `keep-grouped-or-new` : le tab groupé est toujours protégé, et quand l'heuristique ne tranche pas (aucun ou les deux onglets groupés) on privilégie la version fraîchement chargée.
- [ ] Le radio est désactivé visuellement quand la déduplication globale est off.
- [ ] En mode `keep-grouped`, si les deux onglets sont groupés ou aucun, on garde l'ancien (fallback explicite).
- [ ] En mode `keep-new`, l'onglet fermé capture son `groupId`, `title` et `index` avant fermeture ; l'action "Annuler" de la notification rouvre l'onglet et tente de le rattacher à son groupe d'origine (fallback : nouveau groupe si l'original n'existe plus).
- [ ] Lors d'une restauration de session contenant un onglet groupé à l'URL X, si un onglet non groupé à X existe déjà dans la fenêtre et que `deduplicationKeepStrategy = 'keep-grouped'`, le tab restauré (groupé) survit et conserve son appartenance au groupe.
- [ ] Le compteur `tabsDeduplicatedCount` s'incrémente exactement une fois par déduplication, quelle que soit la stratégie.

---

## US-D — Neutralisation de la déduplication pendant la restauration de session

**En tant qu'** utilisateur qui restaure une session,
**je veux** que la déduplication automatique ne ferme pas les onglets fraîchement créés par la restauration,
**afin de** retrouver intégralement le contenu de la session même lorsque des onglets conservés (épinglés, onglet hôte de la page options) partagent une URL avec un onglet de la session.

### Contexte

Le mode « Replace tabs in current window » conserve les onglets épinglés et éventuellement l'onglet hôte de la page options. Sans garde-fou, le handler de déduplication du background fermerait l'un des deux onglets partageant une URL (celui restauré ou celui conservé) dès qu'ils coexistent dans la fenêtre, faisant perdre du contenu à la session ou brisant la référence épinglée.

### Critères d'acceptation

- [ ] Avant toute création d'onglet via `restoreTabs` (cibles `current`, `new` ou `replace`), les URLs issues de la session sont envoyées au background via un message `SESSION_RESTORE_SKIP_DEDUP`.
- [ ] Le handler background appelle `markUrlToSkipDeduplication` pour chaque URL reçue. Le TTL de 10 s du registre skip-dedup couvre la création des onglets d'une session typique.
- [ ] Le handler de déduplication (`src/background/deduplication.ts`) consulte `shouldSkipDeduplication` avant d'agir et n'opère pas sur les URLs en sursis.
- [ ] Cas testé : onglet épinglé à l'URL X + session contenant également X. Après « Replace tabs in current window », les deux onglets coexistent dans la fenêtre.
- [ ] Cas testé : la page options reste ouverte après « Replace » même si la session contient une URL identique à celle de la page options.
