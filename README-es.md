[![en](https://img.shields.io/badge/lang-en-red.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README.md)
[![fr](https://img.shields.io/badge/lang-fr-blue.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-fr.md)
[![es](https://img.shields.io/badge/lang-es-yellow.svg)](https://github.com/EspritVorace/smart-tab-organizer/blob/master/README-es.md)

# SmartTab Organizer

![Versión](https://img.shields.io/badge/version-0.0.1-blue.svg)
![Licencia](https://img.shields.io/badge/License-GPL_v3-blue.svg)

**SmartTab Organizer** es una extensión de Chrome diseñada para ayudarte a administrar eficientemente tus pestañas del navegador agrupando automáticamente las pestañas relacionadas y evitando duplicados.

## Características ✨

* **🖱️ Agrupación Automática (Clic Central):**
    * Cuando haces clic central en un enlace, si el dominio de la página de origen coincide con una regla configurada, la nueva pestaña se abre en un grupo.
    * Si la pestaña de origen ya está en un grupo, la nueva pestaña se une a él.
    * De lo contrario, se crea un nuevo grupo.
* **🏷️ Nombrado Flexible mediante RegEx:**
    * Define expresiones regulares para dominios específicos.
    * El nombre del grupo puede extraerse del título o de la URL de la pestaña, o pedirse manualmente al usuario cuando sea necesario.
    * Incluye preajustes para herramientas populares de gestión de tickets (Jira, GitLab, GitHub, Trello, etc.).
* **🚫 Prevención de Duplicados:**
    * Evita abrir la misma URL varias veces.
    * Si intentas abrir una URL ya presente, la pestaña existente se trae al primer plano y se recarga, y la nueva se cierra.
    * Admite coincidencia exacta de URL o coincidencia "incluida" por dominio.
* **⚙️ Página de Opciones Completa:**
    * Administra (Agregar, Editar, Eliminar, Activar/Desactivar) reglas de dominio.
    * Administra expresiones regulares personalizadas y predefinidas.
    * Configura los modos de deduplicación.
    * Importa y exporta tus configuraciones (reglas y preajustes) mediante JSON.
    * Visualiza estadísticas y reinícialas.
* **🗂️ Gestión de Grupos Lógicos:**
    * Organiza tus reglas de dominio creando y editando grupos lógicos.
    * Personaliza tu experiencia de navegación eligiendo colores específicos para los grupos de pestañas asociados con estos grupos lógicos.
* **🕶️ Soporte de Modo Oscuro:**
    * Elige entre Modo Claro, Modo Oscuro o sigue el tema de tu sistema.
* **🌍 Internacionalización:**
    * Disponible en Francés (Predeterminado), Inglés y Español.
* **📊 Popup de Acceso Rápido:**
    * Activa/Desactiva globalmente la agrupación y la deduplicación.
    * Consulta estadísticas clave de un vistazo.
    * Enlace rápido a la página de opciones.

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

### Permisos

Esta extensión solicita el permiso `scripting` para poder inyectar un pequeño script cuando sea necesario pedir al usuario el nombre del grupo.

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
