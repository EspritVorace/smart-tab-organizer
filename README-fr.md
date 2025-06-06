[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** est une extension Chrome conçue pour vous aider à gérer efficacement vos onglets de navigateur en regroupant automatiquement les onglets liés et en empêchant les doublons.

## Fonctionnalités ✨

### 🖱️ Regroupement Automatique
* Clic molette sur un lien pour ouvrir l'onglet dans le groupe adéquat si le domaine correspond à vos règles.
* L'onglet rejoint un groupe existant ou un nouveau groupe est créé.
* Le nom du groupe peut provenir du titre de l'onglet source, de son URL ou être saisi manuellement.
* Préréglages d'expressions régulières pour les outils de tickets populaires (Jira, GitLab, GitHub, Trello, etc.).

### 🚫 Déduplication
* L'ouverture d'une même URL est empêchée.
* L'onglet existant est remis au premier plan et rechargé.
* Modes de correspondance : URL exacte, nom d'hôte + chemin, nom d'hôte seul ou simple inclusion.

### ⚙️ Options et Personnalisation
* Ajouter, modifier, supprimer ou activer/désactiver les règles de domaine.
* Gérer les expressions régulières personnalisées ou prédéfinies.
* Organiser les règles en groupes logiques et choisir une couleur pour chaque groupe.
* Importer/exporter votre configuration au format JSON.
* Configurer les modes de déduplication.
* Consulter les statistiques (groupes créés et onglets dédupliqués) et les réinitialiser.
* Sélectionner le thème Clair, Sombre ou Système.

### 📊 Popup d'Accès Rapide
* Activer/désactiver globalement le regroupement et la déduplication.
* Voir les statistiques clés en un coup d'œil.
* Accès direct à la page d'options.
* Clic droit sur l'icône pour "Tout désactiver".

### 🌍 Internationalisation
* Disponible en Français (défaut), Anglais et Espagnol.

## Installation 🚀

### Manuelle (Développement / Test)

1.  **Télécharger :** Clonez ou téléchargez ce projet.
    ```bash
    git clone [https://github.com/EspritVorace/smart-tab-organizer.git](https://github.com/EspritVorace/smart-tab-organizer.git)
    ```
2.  **Ouvrir les Extensions Chrome :** Naviguez vers `chrome://extensions/`.
3.  **Activer le Mode Développeur :** Cochez la case "Mode développeur".
4.  **Charger l'Extension :** Cliquez sur "Charger l'extension non empaquetée" et sélectionnez le dossier `SmartTab_Organizer` (celui contenant `manifest.json`).
5.  L'extension est prête !

## Utilisation 📖

1.  **Cliquez sur l'Icône :** Pour accéder au popup.
2.  **Configurez :** Ouvrez les "Options" pour définir vos règles.
    * **Règles de Domaine :** Définissez pour quels sites activer les fonctionnalités.
    * **Préréglages RegEx :** Créez ou utilisez des RegEx pour extraire les noms de groupes (ex: `([A-Z]+-\d+)` pour Jira).
3.  **Naviguez :** Utilisez le clic molette sur les sites configurés et voyez la magie opérer !

## Technologies Utilisées 🛠️

* JavaScript (ES Modules)
* Chrome Extension APIs (Manifest V3)
* preact (pour une UI réactive légère)
* CSS3

## Licence 📄

Ce projet est sous licence **GNU General Public License v3.0**.

---
