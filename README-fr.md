[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** est une extension multi-navigateur conçue pour vous aider à gérer efficacement vos onglets en regroupant automatiquement les onglets liés et en empêchant les doublons.

## Fonctionnalités

### Regroupement Automatique
* Clic molette sur un lien ou clic droit > "Ouvrir le lien dans un nouvel onglet" pour ouvrir l'onglet dans le groupe adéquat si le domaine correspond à vos règles.
* L'onglet rejoint un groupe existant ou un nouveau groupe est créé.
* Le nom du groupe peut provenir du titre de l'onglet source, de son URL ou être saisi manuellement.
* Préréglages d'expressions régulières pour les outils de tickets populaires (Jira, GitLab, GitHub, Trello, etc.).

### Déduplication
* L'ouverture d'une même URL est empêchée.
* L'onglet existant est remis au premier plan et rechargé.
* Modes de correspondance : URL exacte, nom d'hôte + chemin, nom d'hôte seul ou simple inclusion.

### Sessions & Profils
* **Snapshots de session** — Sauvegardez vos onglets ouverts (y compris les groupes d'onglets) sous forme de snapshot nommé via un assistant guidé. Les onglets système sont automatiquement exclus.
* **Profils** — Épinglez n'importe quel snapshot comme profil persistant. Les profils apparaissent en tête de liste et dans le popup pour un accès rapide. Attribuez une icône personnalisée parmi 10 options disponibles.
* **Cartes de session** — Chaque carte affiche le nombre d'onglets, le nombre de groupes, les badges de couleur et la date de dernière mise à jour. Double-cliquez sur le nom pour le renommer en ligne (Entrée pour confirmer, Échap pour annuler).
* **Restauration** — Bouton partagé avec restauration rapide en un clic (fenêtre courante ou nouvelle fenêtre) ou un **assistant de restauration** complet pour sélectionner les onglets à restaurer, choisir la fenêtre cible et résoudre les conflits (doublons d'onglets, collisions de noms de groupes) avant d'appliquer.
* **Éditeur de session** — Ouvrez n'importe quelle session sauvegardée dans un éditeur interactif : renommer la session, modifier ou supprimer des onglets individuels, modifier les URLs, renommer des groupes, supprimer des groupes (avec leurs onglets ou en les dissociant), et déplacer des onglets entre groupes. Une confirmation protège contre la perte accidentelle de données lors de la fermeture avec des changements non sauvegardés.
* **Auto-sync** *(profils uniquement)* — Activez l'auto-sync sur un profil pour capturer automatiquement vos onglets ouverts de manière périodique et les persister à la fermeture de la fenêtre. Une alarme en arrière-plan gère le cycle de vie de la synchronisation ; un verrou empêche l'écrasement d'un profil pendant que son éditeur est ouvert.
* **Exclusivité profil ↔ fenêtre** — Chaque profil suit dans quelle fenêtre de navigateur il est ouvert. L'assistant de restauration vous avertit si un profil est déjà ouvert dans une autre fenêtre, et le popup reflète le statut en temps réel de chaque profil (ouvert ici / ouvert ailleurs / fermé).

### Options et Personnalisation
* Ajouter, modifier, supprimer ou activer/désactiver les règles de domaine.
* Gérer les expressions régulières personnalisées ou prédéfinies avec une interface intuitive en cartes.
* **Assistant d'Import/Export** pour les règles de domaine :
  * Export : sélectionner les règles individuellement, sauvegarder en fichier JSON ou copier dans le presse-papiers.
  * Import : charger depuis un fichier (glisser-déposer) ou coller du JSON, avec validation Zod.
  * Classification automatique des règles importées (nouvelles, en conflit, identiques).
  * Résolution des conflits : écraser, dupliquer ou ignorer, avec vue diff côte à côte.
* Configurer les modes de déduplication par règle.
* Consulter les statistiques (groupes créés et onglets dédupliqués) et les réinitialiser.
* Sélectionner le thème Clair, Sombre ou Système.

### Popup d'Accès Rapide
* Activer/désactiver globalement le regroupement et la déduplication.
* Voir les statistiques clés en un coup d'oeil (section repliable avec état persisté).
* Bouton **Sauvegarder** pour ouvrir instantanément l'assistant de snapshot.
* Bouton **Restaurer** pour naviguer vers la section Sessions.
* **Liste des profils** — Les profils épinglés sont listés dans le popup avec leur statut en temps réel et des actions de restauration rapide.
* Accès direct à la page d'options.

### Accessibilité
* Navigation complète au clavier sur tous les composants.
* Support des lecteurs d'écran avec labels ARIA et landmarks appropriés.
* Construit sur les primitives Radix UI pour une accessibilité native.

### Internationalisation
* Disponible en Anglais, Français et Espagnol.

## Installation

### Manuelle (Développement / Test)

1.  **Télécharger :** Clonez ou téléchargez ce projet.
    ```bash
    git clone https://github.com/EspritVorace/smart-tab-organizer.git
    ```
2.  **Installer les dépendances :**
    ```bash
    npm install
    ```

#### Mode Développement (avec rechargement automatique)
3.  **Démarrer le serveur de développement :**
    ```bash
    # Pour le développement Chrome
    npm run dev

    # Pour le développement Firefox
    npm run dev:firefox
    ```

#### Build de Production
3.  **Construire l'extension :**
    ```bash
    npm run build
    ```

#### Empaquetage pour Distribution
3.  **Créer les packages de distribution :**
    ```bash
    # Créer le package Chrome
    npm run zip

    # Créer le package Firefox
    npm run zip:firefox
    ```

#### Chargement dans le Navigateur
4.  **Charger dans votre navigateur :**
    * Chrome/Chromium : ouvrez `chrome://extensions/` puis "Charger l'extension non empaquetée" en sélectionnant le dossier `.output/chrome-mv3`.
    * Firefox : ouvrez `about:debugging#/runtime/this-firefox` puis "Charger un module complémentaire temporaire" avec `.output/firefox-mv2/manifest.json`.
5.  L'extension est prête !

## Utilisation

1.  **Cliquez sur l'Icône :** Pour accéder au popup.
2.  **Configurez :** Ouvrez les "Options" pour définir vos règles.
    * **Règles de Domaine :** Définissez pour quels sites activer les fonctionnalités.
    * **Préréglages RegEx :** Créez ou utilisez des RegEx pour extraire les noms de groupes (ex: `([A-Z]+-\d+)` pour Jira).
3.  **Naviguez :** Utilisez le clic molette ou clic droit > "Ouvrir le lien dans un nouvel onglet" sur les sites configurés et voyez la magie opérer !
4.  **Sessions :** Utilisez "Prendre un snapshot" pour sauvegarder vos onglets actuels, ou "Nouveau profil" pour créer un profil persistant avec synchronisation automatique.

## Tests

```bash
# Tests unitaires
npm test

# Tests unitaires (environnement WXT)
npm run test:wxt

# Tests E2E (nécessite un build préalable)
npm run test:e2e

# Tests E2E avec l'interface Playwright
npm run test:e2e:ui

# Build puis tests E2E
npm run test:e2e:build

# Storybook (documentation des composants)
npm run storybook
```

## Technologies Utilisées

### Core
* TypeScript & React
* WXT framework pour le développement d'extensions multi-navigateurs
* APIs d'extensions Chrome/Firefox (Manifest V3 / V2)

### UI
* **@radix-ui/themes** - Système de design et composants UI
* **react-accessible-treeview** - Arborescence accessible pour les listes d'onglets dans les assistants et l'éditeur de session
* **@radix-ui/react-toast** - Notifications toast
* **next-themes** - Gestion des thèmes (mode sombre/clair)
* **lucide-react** - Icônes SVG
* **react-hook-form** - Gestion des formulaires

### Validation
* **Zod** - Validation de schémas

### Tests
* **Vitest** - Tests unitaires avec Happy DOM
* **Playwright** - Tests end-to-end
* **Storybook** - Documentation et tests visuels des composants

## Licence

Ce projet est sous licence **GNU General Public License v3.0**.

---
