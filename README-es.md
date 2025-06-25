[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Versión](https://img.shields.io/badge/version-1.0.1-blue.svg)
![Licencia](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** es una extensión de Chrome diseñada para ayudarte a administrar eficientemente tus pestañas del navegador agrupando automáticamente las pestañas relacionadas y evitando duplicados.

## Características ✨

### 🖱️ Agrupación Automática
* Clic central en un enlace para abrir la pestaña en el grupo adecuado si el dominio coincide con tus reglas.
* La pestaña se une a un grupo existente o se crea uno nuevo.
* El nombre del grupo puede obtenerse del título de la pestaña de origen, de su URL o solicitarse manualmente.
* Preajustes de expresiones regulares para herramientas populares de tickets (Jira, GitLab, GitHub, Trello, etc.).

### 🚫 Deduplicación
* Se evita abrir dos veces la misma URL.
* La pestaña existente se vuelve a enfocar y se recarga.
* Modos de coincidencia: URL exacta, nombre de host + ruta, solo nombre de host o coincidencia por inclusión.

### ⚙️ Opciones y Personalización
* Añadir, editar, eliminar o activar/desactivar reglas de dominio.
* Gestionar preajustes y expresiones regulares personalizadas.
* Organizar reglas en grupos lógicos y elegir un color para cada grupo.
* Importar/exportar la configuración en JSON.
* Configurar los modos de deduplicación.
* Consultar las estadísticas (grupos creados y pestañas deduplicadas) y restablecerlas.
* Elegir el tema Claro, Oscuro o Sistema.

### 📊 Popup de Acceso Rápido
* Activar/desactivar globalmente la agrupación y la deduplicación.
* Ver estadísticas clave de un vistazo.
* Acceso directo a la página de opciones.

### 🌍 Internacionalización
* Disponible en Francés (predeterminado), Inglés y Español.

## Instalación 🚀

### Manual (Desarrollo / Pruebas)

1.  **Descargar:** Clona o descarga este proyecto.
    ```bash
    git clone [https://github.com/EspritVorace/smart-tab-organizer.git](https://github.com/EspritVorace/smart-tab-organizer.git)
    ```
2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

#### Modo Desarrollo (con recarga automática)
3.  **Iniciar servidor de desarrollo:**
    ```bash
    # Para desarrollo en Chrome
    npm run dev
    
    # Para desarrollo en Firefox
    npm run dev:firefox
    ```

#### Build de Producción
3.  **Construir la extensión:**
    ```bash
    npm run build
    ```

#### Empaquetado para Distribución
3.  **Crear paquetes de distribución:**
    ```bash
    # Crear paquete Chrome
    npm run zip
    
    # Crear paquete Firefox
    npm run zip:firefox
    ```

#### Cargar en el Navegador
4.  **Cargar en tu navegador:**
    * Chrome/Chromium: abre `chrome://extensions/` y usa "Cargar descomprimida" con la carpeta `.output/chrome-mv3`.
    * Firefox: abre `about:debugging#/runtime/this-firefox` y elige "Cargar complemento temporal" apuntando a `.output/firefox-mv2/manifest.json`.
5.  ¡La extensión está lista!

## Uso 📖

1.  **Haz Clic en el Icono:** Para acceder al popup.
2.  **Configurar:** Abre "Opciones" para establecer tus reglas.
    * **Reglas de Dominio:** Define para qué sitios activar las funciones.
    * **Preajustes de RegEx:** Crea o usa RegEx para extraer nombres de grupos (ej: `([A-Z]+-\d+)` para Jira).
3.  **Navega:** Usa el clic central en los sitios configurados ¡y observa la magia suceder!

## Tecnologías Utilizadas 🛠️

### Core
* JavaScript y TypeScript
* WXT framework para desarrollo de extensiones web
* React para interfaz de usuario reactiva
* APIs de extensiones de Chrome/Firefox (Manifiesto V3)

### Librerías UI
* **@radix-ui/themes** - Sistema de diseño y componentes UI
* **next-themes** - Gestión de temas (modo oscuro/claro)
* **lucide-react** - Iconos SVG
* **react-hook-form** - Gestión de formularios

### Utilidades
* **Zod** - Validación de esquemas

## Licencia 📄

Este proyecto está bajo la licencia **GNU General Public License v3.0**.

---
