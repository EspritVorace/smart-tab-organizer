[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/main/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Licencia](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** es una extensión multinavegador que agrupa automáticamente las pestañas relacionadas, evita duplicados y guarda tus espacios de trabajo como sesiones con nombre.

<p align="center">
  <img src="doc/assets/store.png" alt="SmartTab Organizer">
</p>

## Características

### ⚙️ Gestión de Reglas

Las reglas de dominio se crean mediante un asistente guiado de 4 pasos: identidad → modo de nombrado → opciones → resumen.

Tres modos de nombrado de grupo:
- **Preajuste** — elige un patrón regex integrado o personalizado (IDs de tickets Jira, nombres de repos de GitHub…)
- **Preguntar** — solicita un nombre cuando se abre la pestaña
- **Manual** — nombre de grupo fijo

<p align="center">
  <img src="doc/assets/es-dark-rules-create-summary.png" alt="Asistente de creación de regla — paso resumen">
</p>

### 🗂️ Agrupación Automática

Clic central o clic derecho → «Abrir en una pestaña nueva» en un sitio configurado, y la pestaña aterriza al instante en el grupo correcto.

- Nombre del grupo extraído del título de la página, la URL o un preajuste regex
- Preajustes integrados para Jira, GitLab, GitHub, Trello y más

<p align="center">
  <img src="doc/assets/regroup.gif" alt="Vídeo de agrupación automática">
</p>

### 🔁 Deduplicación

Abrir una página que ya está abierta reactiva y recarga la pestaña existente en lugar de crear una nueva.
La sensibilidad de coincidencia es configurable por regla: URL exacta, nombre de host + ruta, nombre de host o «includes».

<p align="center">
  <img src="doc/assets/dedup.gif" alt="Vídeo de deduplicación">
</p>


### 📷 Sesiones

Guarda un snapshot con nombre de tus pestañas y grupos abiertos, y restáuralos cuando los necesites.

- **Sesiones ancladas** — convierte cualquier snapshot en acceso rápido desde el popup, con un icono personalizado
- **Asistente de restauración** — elige qué pestañas recuperar, la ventana de destino y resuelve conflictos de grupos antes de aplicar
- **Búsqueda profunda** — encuentra pestañas y grupos por nombre en todas tus sesiones guardadas
- **Editor de sesión** — reorganiza, renombra y elimina pestañas y grupos sin necesidad de restaurar

<p align="center">
  <img src="doc/assets/es-dark-sessions-list.png" alt="Lista de sesiones">
</p>

<p align="center">
  <img src="doc/assets/es-dark-sessions-search-deep.png" alt="Búsqueda profunda en sesiones">
</p>


Un **asistente de importación/exportación para Reglas y Sesiones** clasifica los elementos entrantes como nuevos, en conflicto o idénticos, y resuelve los conflictos paso a paso.

<p align="center">
  <img src="doc/assets/es-dark-rules-import-text-conflicts.png" alt="Asistente de importación con resolución de conflictos">
</p>

### ⚡ Popup de Acceso Rápido

- Activa/desactiva globalmente la agrupación y la deduplicación
- Toma un snapshot o accede a Sesiones con un clic
- Sesiones ancladas listadas con acciones de restauración rápida

<p align="center">

<img src="doc/assets/es-dark-popup-content.png" alt="Contenido del popup">
</p>

### ♿ Accesibilidad e i18n

Navegación completa por teclado y soporte para lectores de pantalla mediante primitivas Radix UI. Disponible en Inglés, Francés y Español.

## 🛒 Chrome Web Store ##

Abrir en Chrome Web Store

[![Abrir en Chrome Web Store](https://img.shields.io/chrome-web-store/v/ijnpdkkcbmfikocmboibffjgbohhlmah)](https://chromewebstore.google.com/detail/smarttab-organizer/ijnpdkkcbmfikocmboibffjgbohhlmah)


## 💻 Instalación

```bash
git clone https://github.com/EspritVorace/smart-tab-organizer.git
cd smart-tab-organizer
npm install -g pnpm  # si es necesario
pnpm install
pnpm build
```

- **Chrome:** `chrome://extensions/` → Cargar descomprimida → `.output/chrome-mv3`
manifest.json`

Para desarrollo con recarga automática: `pnpm dev` (Chrome) o `pnpm dev:firefox`.

## 🛠️ Stack Tecnológico

WXT · React + TypeScript · Radix UI Themes · Zod · Vitest · Playwright

## 📜 Licencia

GNU General Public License v3.0
