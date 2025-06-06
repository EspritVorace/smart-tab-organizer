[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Versión](https://img.shields.io/badge/version-0.0.1-blue.svg)
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
* Clic derecho en el icono para "Desactivar todo".

### 🌍 Internacionalización
* Disponible en Francés (predeterminado), Inglés y Español.

## Instalación 🚀

### Manual (Desarrollo / Pruebas)

1.  **Descargar:** Clona o descarga este proyecto.
    ```bash
    git clone [https://github.com/EspritVorace/smart-tab-organizer.git](https://github.com/EspritVorace/smart-tab-organizer.git)
    ```
2.  **Abrir Extensiones de Chrome:** Navega a `chrome://extensions/`.
3.  **Activar Modo Desarrollador:** Marca la casilla "Modo desarrollador".
4.  **Cargar Extensión:** Haz clic en "Cargar descomprimida" y selecciona la carpeta `SmartTab_Organizer` (la que contiene `manifest.json`).
5.  ¡La extensión está lista!

## Uso 📖

1.  **Haz Clic en el Icono:** Para acceder al popup.
2.  **Configurar:** Abre "Opciones" para establecer tus reglas.
    * **Reglas de Dominio:** Define para qué sitios activar las funciones.
    * **Preajustes de RegEx:** Crea o usa RegEx para extraer nombres de grupos (ej: `([A-Z]+-\d+)` para Jira).
3.  **Navega:** Usa el clic central en los sitios configurados ¡y observa la magia suceder!

## Tecnologías Utilizadas 🛠️

* JavaScript (Módulos ES)
* APIs de Extensiones de Chrome (Manifiesto V3)
* preact (para una interfaz de usuario reactiva y ligera)
* CSS3

## Licencia 📄

Este proyecto está bajo la licencia **GNU General Public License v3.0**.

---
