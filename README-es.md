[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Licencia](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** es una extensión multinavegador para agrupar automáticamente las pestañas relacionadas y evitar duplicados.

## Características

### 🗂️ Agrupación Automática
Clic central o clic derecho > "Abrir en una pestaña nueva" para colocar instantáneamente una pestaña en el grupo correcto según tus reglas de dominio.
- Nombre del grupo extraído del título de la página, la URL o un preajuste regex
- Preajustes integrados para herramientas populares: Jira, GitLab, GitHub, Trello…

### 🔁 Deduplicación
Evita que se abra la misma página dos veces — la pestaña existente se vuelve a enfocar y se recarga.
- Sensibilidad de coincidencia configurable por regla: URL exacta, nombre de host + ruta, nombre de host o inclusión

### 📷 Sesiones y Perfiles
Guarda snapshots con nombre de tus pestañas y grupos abiertos, y restáuralos en cualquier momento.
- **Asistente de restauración** — elige qué pestañas recuperar, la ventana de destino y resuelve conflictos antes de aplicar
- **Perfiles** — ancla cualquier snapshot como perfil persistente con icono personalizado, acceso desde el popup y auto-sync
- **Editor de sesión** — reorganiza, renombra y elimina pestañas y grupos sin necesidad de restaurar previamente

### ⚙️ Opciones y Personalización
Gestiona reglas de dominio y preajustes regex con una interfaz de tarjetas.
- **Asistente de importación/exportación** — clasificación automática de reglas entrantes (nuevas, en conflicto, idénticas) y resolución paso a paso
- Configura el modo de deduplicación por regla, consulta estadísticas, cambia entre temas Claro/Oscuro/Sistema

### ⚡ Popup de Acceso Rápido
- Activa/desactiva globalmente la agrupación y la deduplicación
- Toma un snapshot o accede a la página de Sesiones con un clic
- Perfiles anclados listados con su estado en tiempo real y acciones de restauración rápida

### ♿ Accesibilidad e i18n
- Navegación completa por teclado y soporte para lectores de pantalla (primitivas Radix UI)
- Disponible en Inglés, Francés y Español

## Instalación

### Manual (Desarrollo / Pruebas)

1.  **Descargar:** Clona o descarga este proyecto.
    ```bash
    git clone https://github.com/EspritVorace/smart-tab-organizer.git
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

#### Modo Desarrollo (con recarga automática)
3.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev          # Chrome
    npm run dev:firefox  # Firefox
    ```

#### Build de Producción
3.  **Construir la extensión:**
    ```bash
    npm run build
    ```

#### Empaquetado para Distribución
3.  **Crear paquetes de distribución:**
    ```bash
    npm run zip          # Chrome
    npm run zip:firefox  # Firefox
    ```

#### Cargar en el Navegador
4.  **Cargar en tu navegador:**
    * Chrome/Chromium: `chrome://extensions/` → "Cargar descomprimida" → `.output/chrome-mv3`
    * Firefox: `about:debugging#/runtime/this-firefox` → "Cargar complemento temporal" → `.output/firefox-mv2/manifest.json`

## Uso

1.  **Haz Clic en el Icono:** Para acceder al popup.
2.  **Configurar:** Abre "Opciones" para establecer tus reglas.
    * **Reglas de Dominio:** Define para qué sitios activar las funciones.
    * **Preajustes de RegEx:** Extrae nombres de grupos con regex (ej: `([A-Z]+-\d+)` para Jira).
3.  **Navega:** Clic central o clic derecho > "Abrir en una pestaña nueva" en los sitios configurados.
4.  **Sesiones:** Guarda un snapshot o crea un perfil persistente desde el popup o la página de opciones.

## Pruebas

```bash
npm test                  # Pruebas unitarias
npm run test:wxt          # Pruebas unitarias (entorno WXT)
npm run test:e2e          # Pruebas E2E (requiere build previo)
npm run test:e2e:build    # Build y luego pruebas E2E
npm run test:e2e:ui       # Pruebas E2E con interfaz Playwright
npm run storybook         # Documentación de componentes (puerto 6006)
```

## Stack Tecnológico

* **WXT** — framework de extensiones multinavegador (Chrome MV3 / Firefox MV2)
* **React + TypeScript**, **Radix UI Themes**, **React Hook Form**, **Zod**
* **Vitest** (unitario) · **Playwright** (E2E) · **Storybook** (componentes)

## Licencia

Este proyecto está bajo la licencia **GNU General Public License v3.0**.

---
