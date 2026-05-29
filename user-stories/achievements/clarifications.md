# Clarifications · Référentiel d'exploration et jalons (issue #51)

Le module « achievements » de l'issue #51 est réorienté en référentiel
d'exploration : un catalogue exhaustif des capacités utilisateur, doublé d'une
couche de suivi « découvert / pas encore » qui alimente des barres de progression
par domaine, une couverture globale et des phases nommées. Aucune gamification.

Décisions actées avant rédaction (cf. corps de l'issue #51) :

1. **Phases** : 4 phases.
   - FR : Découverte · Prise en main · Maîtrise · Expertise
   - EN : Discovery · Getting started · Proficiency · Expertise
   - ES : Descubrimiento · Familiarización · Dominio · Pericia
   - Ce sont des états du parcours, jamais un jugement sur la personne.

2. **Déclencheur du marquage** : à l'affichage ou à la sélection (par exemple choisir
   un mode dans le wizard), jamais à la sauvegarde. Marquage idempotent et non
   réversible. L'utilisateur n'est jamais forcé de conserver un artefact factice.

3. **Couverture globale** : à plat. Chaque entrée du catalogue compte pour 1 dans un
   total unique. La phase courante découle du pourcentage global.

4. **Emplacement** : page dédiée dans la section « Tracking » de la sidebar (à côté de
   `StatisticsPage`), plus un widget compact sur la `HomePage` à côté de
   `MiniStatsSection`.

5. **Raccourcis clavier** : regroupés en quelques entrées de catalogue (séquences,
   mnémoniques sidebar, commandes globales, help drawer, doc contextuelle F1,
   navigation clavier des listes), pas une entrée par `shortcut.id`.

6. **Source des définitions** : module TypeScript dans `src/` (ex.
   `src/exploration/catalog.ts`), règle de détection exprimée en fonction typée,
   entrées dérivées des sources existantes (`src/shortcuts/registry.ts`,
   `src/schemas/enums.ts`, `src/data/categories.json`) quand c'est possible.

7. **Rétroactivité** : non. Le catalogue démarre vierge pour tous, y compris les
   utilisateurs actuels. Seuls les événements postérieurs à l'init du module marquent
   une découverte. Pas de backfill de l'état pré-existant.

## Conséquence sur le modèle de détection

Les trois niveaux (point de contact, dérivation depuis l'état conservé, réutilisation
d'un compteur existant) restent valides pour les événements futurs. Le niveau 2 ne
crédite plus l'état pré-existant à l'init : il ne marque une découverte que sur une
mutation d'état observée après l'init.

## Stockage

La progression d'exploration est un état au niveau utilisateur, pas par workspace.
Clé globale `explorationProgress` (et non `local:ws:{wsId}:...`), `storageItem` typé,
schéma Zod et migration. Un `initializedAt` permet de ne créditer que les mutations
postérieures à l'init.
