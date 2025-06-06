[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)
![License](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** est une extension Chrome conçue pour vous aider à gérer efficacement vos onglets de navigateur en regroupant automatiquement les onglets liés et en empêchant les doublons.

## Fonctionnalités ✨

* **🖱️ Regroupement Automatique (Clic Molette) :**
    * Lorsque vous cliquez avec la molette sur un lien, si le domaine de la page source correspond à une règle configurée, le nouvel onglet s'ouvre dans un groupe.
    * Si l'onglet source est déjà dans un groupe, le nouvel onglet le rejoint.
    * Sinon, un nouveau groupe est créé.
* **🏷️ Nommage Flexible via RegEx :**
    * Définissez des expressions régulières pour des domaines spécifiques.
    * Le nom de groupe peut être extrait du titre ou de l'URL de l'onglet, ou être saisi manuellement lorsque nécessaire.
    * Inclut des préréglages pour les outils de tickets populaires (Jira, GitLab, GitHub, Trello, etc.).
* **🚫 Prévention des Doublons :**
    * Empêche l'ouverture plusieurs fois de la même URL.
    * Si vous essayez d'ouvrir une URL déjà présente, l'onglet existant est mis au premier plan et rechargé, et le nouveau est fermé.
    * Prend en charge la correspondance d'URL exacte ou "incluse" par domaine.
* **⚙️ Page d'Options Complète :**
    * Gérez (Ajouter, Editer, Supprimer, Activer/Désactiver) les règles de domaine.
    * Gérez les expressions régulières personnalisées et prédéfinies.
    * Configurez les modes de déduplication.
    * Importez et exportez vos paramètres (règles et préréglages) via JSON.
    * Visualisez les statistiques et réinitialisez-les.
* **🗂️ Gestion des Groupes Logiques :**
    * Organisez vos règles de domaine en créant et en modifiant des groupes logiques.
    * Personnalisez votre expérience de navigation en choisissant des couleurs spécifiques pour les groupes d'onglets associés à ces groupes logiques.
* **🕶️ Support du Mode Sombre :**
    * Choisissez entre le Mode Clair, le Mode Sombre, ou suivez le thème de votre système.
* **🌍 Internationalisation :**
    * Disponible en Français (Défaut), Anglais et Espagnol.
* **📊 Popup d'Accès Rapide :**
    * Activez/Désactivez globalement le regroupement et la déduplication.
    * Consultez les statistiques clés en un coup d'œil.
    * Lien rapide vers la page d'options.

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

### Permissions

Cette extension requiert la permission `scripting` afin d'injecter un script lorsque le nom du groupe doit être saisi par l'utilisateur.

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
