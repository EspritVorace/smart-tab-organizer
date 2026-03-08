[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** est une extension multi-navigateur pour regrouper automatiquement les onglets liés et éviter les doublons.

## Fonctionnalités

### 🗂️ Regroupement Automatique
Clic molette ou clic droit > "Ouvrir dans un nouvel onglet" pour placer instantanément un onglet dans le bon groupe selon vos règles de domaine.
- Nom du groupe extrait du titre de la page, de l'URL ou d'un préréglage regex
- Préréglages intégrés pour les outils populaires : Jira, GitLab, GitHub, Trello…

### 🔁 Déduplication
Empêche l'ouverture d'une même page deux fois — l'onglet existant est remis au premier plan et rechargé.
- Sensibilité de correspondance configurable par règle : URL exacte, nom d'hôte + chemin, nom d'hôte ou inclusion

### 📷 Sessions & Profils
Sauvegardez des snapshots nommés de vos onglets et groupes ouverts, puis restaurez-les à tout moment.
- **Assistant de restauration** — choisissez les onglets à récupérer, la fenêtre cible, et résolvez les conflits avant d'appliquer
- **Profils** — épinglez un snapshot comme profil persistant avec icône personnalisée, accès depuis le popup et auto-sync
- **Éditeur de session** — réorganisez, renommez et supprimez onglets et groupes sans avoir à restaurer au préalable

### ⚙️ Options et Personnalisation
Gérez les règles de domaine et les préréglages regex via une interface en cartes.
- **Assistant d'import/export** — classement automatique des règles entrantes (nouvelles, en conflit, identiques) et résolution pas à pas
- Configurez le mode de déduplication par règle, suivez les statistiques, basculez entre les thèmes Clair/Sombre/Système

### ⚡ Popup d'Accès Rapide
- Activez/désactivez globalement le regroupement et la déduplication
- Prenez un snapshot ou accédez à la page Sessions en un clic
- Profils épinglés listés avec leur statut en temps réel et des actions de restauration rapide

### ♿ Accessibilité & i18n
- Navigation complète au clavier et support des lecteurs d'écran (primitives Radix UI)
- Disponible en Anglais, Français et Espagnol

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
    npm run dev          # Chrome
    npm run dev:firefox  # Firefox
    ```

#### Build de Production
3.  **Construire l'extension :**
    ```bash
    npm run build
    ```

#### Empaquetage pour Distribution
3.  **Créer les packages de distribution :**
    ```bash
    npm run zip          # Chrome
    npm run zip:firefox  # Firefox
    ```

#### Chargement dans le Navigateur
4.  **Charger dans votre navigateur :**
    * Chrome/Chromium : `chrome://extensions/` → "Charger l'extension non empaquetée" → `.output/chrome-mv3`
    * Firefox : `about:debugging#/runtime/this-firefox` → "Charger un module complémentaire temporaire" → `.output/firefox-mv2/manifest.json`

## Utilisation

1.  **Cliquez sur l'Icône :** Pour accéder au popup.
2.  **Configurez :** Ouvrez les "Options" pour définir vos règles.
    * **Règles de Domaine :** Définissez pour quels sites activer les fonctionnalités.
    * **Préréglages RegEx :** Extrayez les noms de groupes avec des regex (ex : `([A-Z]+-\d+)` pour Jira).
3.  **Naviguez :** Clic molette ou clic droit > "Ouvrir dans un nouvel onglet" sur les sites configurés.
4.  **Sessions :** Sauvegardez un snapshot ou créez un profil persistant depuis le popup ou la page d'options.

## Tests

```bash
npm test                  # Tests unitaires
npm run test:wxt          # Tests unitaires (environnement WXT)
npm run test:e2e          # Tests E2E (nécessite un build préalable)
npm run test:e2e:build    # Build puis tests E2E
npm run test:e2e:ui       # Tests E2E avec l'interface Playwright
npm run storybook         # Documentation des composants (port 6006)
```

## Stack Technique

* **WXT** — framework d'extension multi-navigateur (Chrome MV3 / Firefox MV2)
* **React + TypeScript**, **Radix UI Themes**, **React Hook Form**, **Zod**
* **Vitest** (unitaire) · **Playwright** (E2E) · **Storybook** (composants)

## Licence

Ce projet est sous licence **GNU General Public License v3.0**.

---
