// Centralized copy for the landing page sections (FR root / EN / ES).
// Components stay presentational and read landing[locale].
// Writing rule: no em-dash or en-dash anywhere in the strings.

import type { Locale } from './locale';

export interface FeatureItem {
  /** Iconify name from @iconify-json/flat-color-icons, e.g. "flat-color-icons:rules". */
  icon: string;
  title: string;
  description: string;
}

export interface PrivacyPoint {
  icon: string;
  label: string;
}

export interface ComparisonCell {
  /**
   * 'yes' => positive (green check), 'no' => negative (red cross),
   * 'neutral' => not comparable / varies (no mark, text only).
   */
  state: 'yes' | 'no' | 'neutral';
  text: string;
}

export interface ComparisonRow {
  criterion: string;
  sto: ComparisonCell;
  /** Local regex grouping extensions (the real browser competitors). */
  localRegex: ComparisonCell;
  /** Tools that name groups through a remote AI service. */
  aiTools: ComparisonCell;
}

export interface ValueItem {
  icon: string;
  title: string;
  description: string;
}

export interface ShowcaseItem {
  /** Screen name suffix in docs/src/assets/screenshots/{locale}-{theme}-{screen}.png. */
  screen: string;
  alt: string;
  caption: string;
}

export interface LandingCopy {
  features: {
    title: string;
    subtitle: string;
    items: FeatureItem[];
  };
  privacy: {
    title: string;
    subtitle: string;
    points: PrivacyPoint[];
    note: string;
  };
  comparison: {
    title: string;
    subtitle: string;
    columnCriterion: string;
    columnSto: string;
    columnLocalRegex: string;
    columnAiTools: string;
    rows: ComparisonRow[];
  };
  values: {
    title: string;
    subtitle: string;
    items: ValueItem[];
  };
  showcase: {
    title: string;
    subtitle: string;
    items: ShowcaseItem[];
  };
  cta: {
    title: string;
    subtitle: string;
    install: string;
    installPath: string;
    github: string;
    githubHref: string;
    chrome: string;
    chromeHref: string;
    firefox: string;
    firefoxHref: string;
  };
}

const GITHUB_URL = 'https://github.com/EspritVorace/smart-tab-organizer';
const CHROME_URL =
  'https://chromewebstore.google.com/detail/smarttab-organizer/ijnpdkkcbmfikocmboibffjgbohhlmah';
const FIREFOX_URL = 'https://addons.mozilla.org/firefox/addon/smarttab-organizer/';

export const landing: Record<Locale, LandingCopy> = {
  fr: {
    features: {
      title: 'Tout ce dont vos onglets ont besoin',
      subtitle:
        'Six fonctions complémentaires pour transformer un navigateur surchargé en outil de travail organisé.',
      items: [
        {
          icon: 'flat-color-icons:tree-structure',
          title: 'Groupement automatique',
          description:
            "Les onglets ouverts depuis un même parent rejoignent un groupe coloré, selon vos règles, sans intervention manuelle.",
        },
        {
          icon: 'flat-color-icons:reuse',
          title: 'Déduplication',
          description:
            'Trois modes de correspondance (URL exacte, sans paramètres ignorés, inclusion) ferment les doublons en gardant le bon onglet.',
        },
        {
          icon: 'flat-color-icons:data-backup',
          title: 'Sessions et profils',
          description:
            "Capturez l'état du navigateur, épinglez les contextes récurrents, restaurez-les en un clic avec résolution des conflits.",
        },
        {
          icon: 'flat-color-icons:rules',
          title: 'Règles et packs regex',
          description:
            "Écrivez vos expressions régulières ou partez de 49 packs prêts à l'emploi, classés par catégorie.",
        },
        {
          icon: 'flat-color-icons:data-configuration',
          title: 'Import et export',
          description:
            'Sauvegardez et partagez vos règles et sessions en JSON valide, avec détection et résolution des conflits.',
        },
        {
          icon: 'flat-color-icons:briefcase',
          title: 'Espaces de travail',
          description:
            "Séparez travail et perso via des espaces distincts, chacun avec sa couleur d'accent et son exclusivité de fenêtre.",
        },
      ],
    },
    privacy: {
      title: 'Tout est local, rien ne part en ligne',
      subtitle:
        "L'inverse exact des outils de nommage par IA, qui envoient vos URL à un service distant. Ici, vos données ne quittent jamais le navigateur.",
      points: [
        { icon: 'flat-color-icons:data-protection', label: 'Stockage dans browser.storage.local, sur votre machine.' },
        { icon: 'flat-color-icons:broken-link', label: 'Zéro requête réseau initiée par l\'extension.' },
        { icon: 'flat-color-icons:privacy', label: 'Zéro télémétrie, zéro analytics, zéro pistage.' },
        { icon: 'flat-color-icons:lock', label: 'Zéro compte, zéro cloud, zéro IA distante.' },
      ],
      note: 'Si vous synchronisez vos profils Chrome ou Firefox, les données suivent le profil, mais aucune communication réseau n\'est initiée par l\'extension elle-même.',
    },
    comparison: {
      title: 'Pourquoi pas une alternative ?',
      subtitle:
        "Face aux deux familles d'alternatives : les extensions de groupement par regex locales, et les outils qui nomment les groupes via une IA distante.",
      columnCriterion: 'Critère',
      columnSto: 'Smart Tab Organizer',
      columnLocalRegex: 'Extensions regex locales',
      columnAiTools: 'Outils de nommage par IA',
      rows: [
        {
          criterion: 'Nom de groupe',
          sto: { state: 'yes', text: "Extrait de l'URL ou du titre" },
          localRegex: { state: 'no', text: 'Fixe, une règle par valeur' },
          aiTools: { state: 'no', text: 'Généré par IA distante' },
        },
        {
          criterion: 'Données envoyées en ligne',
          sto: { state: 'yes', text: 'Aucune' },
          localRegex: { state: 'yes', text: 'Aucune' },
          aiTools: { state: 'no', text: 'URL et titre envoyés à un tiers' },
        },
        {
          criterion: 'Prix',
          sto: { state: 'yes', text: 'Gratuit, open source GPLv3' },
          localRegex: { state: 'neutral', text: 'Souvent gratuit' },
          aiTools: { state: 'neutral', text: 'Souvent freemium' },
        },
        {
          criterion: 'Code source',
          sto: { state: 'yes', text: 'Open source (GPLv3)' },
          localRegex: { state: 'neutral', text: 'Variable' },
          aiTools: { state: 'neutral', text: 'Variable' },
        },
        {
          criterion: 'Accessibilité',
          sto: { state: 'yes', text: 'Polices dys, audits axe-core' },
          localRegex: { state: 'neutral', text: 'Variable' },
          aiTools: { state: 'neutral', text: 'Variable' },
        },
      ],
    },
    values: {
      title: 'Des valeurs, pas seulement des fonctions',
      subtitle: 'Ce qui guide chaque décision de conception.',
      items: [
        {
          icon: 'flat-color-icons:copyleft',
          title: 'Open source',
          description:
            'Code ouvert, vérifiable et contribuable. Vous savez exactement ce que fait l\'extension, ligne par ligne.',
        },
        {
          icon: 'flat-color-icons:reading',
          title: 'Accessibilité',
          description:
            'Polices adaptées aux troubles dys (Luciole, Atkinson Hyperlegible), focus visibles, audits axe-core en continu.',
        },
        {
          icon: 'flat-color-icons:donate',
          title: 'Gratuit pour toujours',
          description:
            'Pas de version payante, pas de palier premium, pas de fonction bridée. Tout, gratuitement, durablement.',
        },
      ],
    },
    showcase: {
      title: 'Un aperçu en images',
      subtitle: 'Vos règles groupent les onglets, vos sessions sauvegardent vos contextes de travail.',
      items: [
        {
          screen: 'journey-rules-list-populated',
          alt: 'Page Options de SmartTab Organizer affichant une liste de règles de domaine.',
          caption: 'Des règles de domaine qui groupent vos onglets automatiquement.',
        },
        {
          screen: 'journey-sessions-list-with-snapshot',
          alt: 'Liste des sessions de SmartTab Organizer avec un instantané enregistré.',
          caption: 'Vos sessions de travail, sauvegardées et restaurables en un clic.',
        },
      ],
    },
    cta: {
      title: 'Reprenez le contrôle de vos onglets',
      subtitle: 'Installation en quelques secondes, sans compte ni configuration obligatoire.',
      install: 'Installer',
      installPath: '/decouverte/installation',
      github: 'Voir sur GitHub',
      githubHref: GITHUB_URL,
      chrome: 'Ajouter à Chrome',
      chromeHref: CHROME_URL,
      firefox: 'Ajouter à Firefox',
      firefoxHref: FIREFOX_URL,
    },
  },

  en: {
    features: {
      title: 'Everything your tabs need',
      subtitle:
        'Six complementary features that turn an overloaded browser into an organized work tool.',
      items: [
        {
          icon: 'flat-color-icons:tree-structure',
          title: 'Automatic grouping',
          description:
            'Tabs opened from the same parent join a colored group, following your rules, with no manual work.',
        },
        {
          icon: 'flat-color-icons:reuse',
          title: 'Deduplication',
          description:
            'Three matching modes (exact URL, ignored params stripped, includes) close duplicates while keeping the right tab.',
        },
        {
          icon: 'flat-color-icons:data-backup',
          title: 'Sessions and profiles',
          description:
            'Capture the browser state, pin recurring contexts, restore them in one click with conflict resolution.',
        },
        {
          icon: 'flat-color-icons:rules',
          title: 'Rules and regex packs',
          description:
            'Write your own regular expressions or start from 49 ready-to-use packs, sorted by category.',
        },
        {
          icon: 'flat-color-icons:data-configuration',
          title: 'Import and export',
          description:
            'Back up and share your rules and sessions as validated JSON, with conflict detection and resolution.',
        },
        {
          icon: 'flat-color-icons:briefcase',
          title: 'Workspaces',
          description:
            'Separate work and personal life through distinct workspaces, each with its accent color and window exclusivity.',
        },
      ],
    },
    privacy: {
      title: 'Everything is local, nothing goes online',
      subtitle:
        'The exact opposite of AI naming tools, which send your URLs to a remote service. Here, your data never leaves the browser.',
      points: [
        { icon: 'flat-color-icons:data-protection', label: 'Stored in browser.storage.local, on your machine.' },
        { icon: 'flat-color-icons:broken-link', label: 'Zero network request initiated by the extension.' },
        { icon: 'flat-color-icons:privacy', label: 'Zero telemetry, zero analytics, zero tracking.' },
        { icon: 'flat-color-icons:lock', label: 'Zero account, zero cloud, zero remote AI.' },
      ],
      note: 'If you sync your Chrome or Firefox profiles, data follows the profile, but the extension itself never initiates any network communication.',
    },
    comparison: {
      title: 'Why not an alternative?',
      subtitle:
        'Compared with the two families of alternatives: local regex grouping extensions, and tools that name groups through remote AI.',
      columnCriterion: 'Criterion',
      columnSto: 'Smart Tab Organizer',
      columnLocalRegex: 'Local regex extensions',
      columnAiTools: 'AI naming tools',
      rows: [
        {
          criterion: 'Group naming',
          sto: { state: 'yes', text: 'Extracted from the URL or title' },
          localRegex: { state: 'no', text: 'Fixed, one rule per value' },
          aiTools: { state: 'no', text: 'Generated by remote AI' },
        },
        {
          criterion: 'Data sent online',
          sto: { state: 'yes', text: 'None' },
          localRegex: { state: 'yes', text: 'None' },
          aiTools: { state: 'no', text: 'URL and title sent to a third party' },
        },
        {
          criterion: 'Price',
          sto: { state: 'yes', text: 'Free, open source GPLv3' },
          localRegex: { state: 'neutral', text: 'Often free' },
          aiTools: { state: 'neutral', text: 'Often freemium' },
        },
        {
          criterion: 'Source code',
          sto: { state: 'yes', text: 'Open source (GPLv3)' },
          localRegex: { state: 'neutral', text: 'Varies' },
          aiTools: { state: 'neutral', text: 'Varies' },
        },
        {
          criterion: 'Accessibility',
          sto: { state: 'yes', text: 'Dys fonts, axe-core audits' },
          localRegex: { state: 'neutral', text: 'Varies' },
          aiTools: { state: 'neutral', text: 'Varies' },
        },
      ],
    },
    values: {
      title: 'Values, not just features',
      subtitle: 'What guides every design decision.',
      items: [
        {
          icon: 'flat-color-icons:copyleft',
          title: 'Open source',
          description:
            'Open, auditable, contributable code. You know exactly what the extension does, line by line.',
        },
        {
          icon: 'flat-color-icons:reading',
          title: 'Accessibility',
          description:
            'Fonts designed for dyslexia (Luciole, Atkinson Hyperlegible), visible focus, continuous axe-core audits.',
        },
        {
          icon: 'flat-color-icons:donate',
          title: 'Free forever',
          description:
            'No paid version, no premium tier, no gated feature. Everything, for free, for good.',
        },
      ],
    },
    showcase: {
      title: 'A look in pictures',
      subtitle: 'Your rules group the tabs, your sessions save your work contexts.',
      items: [
        {
          screen: 'journey-rules-list-populated',
          alt: 'SmartTab Organizer Options page showing a list of domain rules.',
          caption: 'Domain rules that group your tabs automatically.',
        },
        {
          screen: 'journey-sessions-list-with-snapshot',
          alt: 'SmartTab Organizer sessions list with a saved snapshot.',
          caption: 'Your work sessions, saved and restorable in one click.',
        },
      ],
    },
    cta: {
      title: 'Take back control of your tabs',
      subtitle: 'Install in seconds, with no account and no mandatory setup.',
      install: 'Install',
      installPath: '/decouverte/installation',
      github: 'View on GitHub',
      githubHref: GITHUB_URL,
      chrome: 'Add to Chrome',
      chromeHref: CHROME_URL,
      firefox: 'Add to Firefox',
      firefoxHref: FIREFOX_URL,
    },
  },

  es: {
    features: {
      title: 'Todo lo que tus pestañas necesitan',
      subtitle:
        'Seis funciones complementarias que convierten un navegador sobrecargado en una herramienta de trabajo organizada.',
      items: [
        {
          icon: 'flat-color-icons:tree-structure',
          title: 'Agrupación automática',
          description:
            'Las pestañas abiertas desde un mismo padre se unen a un grupo de color, según tus reglas, sin intervención manual.',
        },
        {
          icon: 'flat-color-icons:reuse',
          title: 'Deduplicación',
          description:
            'Tres modos de coincidencia (URL exacta, sin parámetros ignorados, inclusión) cierran los duplicados conservando la pestaña correcta.',
        },
        {
          icon: 'flat-color-icons:data-backup',
          title: 'Sesiones y perfiles',
          description:
            'Captura el estado del navegador, fija los contextos recurrentes, restáuralos con un clic y resolución de conflictos.',
        },
        {
          icon: 'flat-color-icons:rules',
          title: 'Reglas y paquetes regex',
          description:
            'Escribe tus expresiones regulares o parte de 49 paquetes listos para usar, ordenados por categoría.',
        },
        {
          icon: 'flat-color-icons:data-configuration',
          title: 'Importar y exportar',
          description:
            'Guarda y comparte tus reglas y sesiones en JSON validado, con detección y resolución de conflictos.',
        },
        {
          icon: 'flat-color-icons:briefcase',
          title: 'Espacios de trabajo',
          description:
            'Separa trabajo y vida personal con espacios distintos, cada uno con su color de acento y su exclusividad de ventana.',
        },
      ],
    },
    privacy: {
      title: 'Todo es local, nada sale a internet',
      subtitle:
        'Lo contrario exacto de las herramientas de nombrado por IA, que envían tus URL a un servicio remoto. Aquí, tus datos nunca salen del navegador.',
      points: [
        { icon: 'flat-color-icons:data-protection', label: 'Almacenamiento en browser.storage.local, en tu equipo.' },
        { icon: 'flat-color-icons:broken-link', label: 'Cero solicitudes de red iniciadas por la extensión.' },
        { icon: 'flat-color-icons:privacy', label: 'Cero telemetría, cero analíticas, cero rastreo.' },
        { icon: 'flat-color-icons:lock', label: 'Cero cuenta, cero nube, cero IA remota.' },
      ],
      note: 'Si sincronizas tus perfiles de Chrome o Firefox, los datos siguen al perfil, pero la extensión nunca inicia ninguna comunicación de red por sí misma.',
    },
    comparison: {
      title: '¿Por qué no una alternativa?',
      subtitle:
        'Frente a las dos familias de alternativas: las extensiones de agrupación por regex locales y las herramientas que nombran los grupos mediante IA remota.',
      columnCriterion: 'Criterio',
      columnSto: 'Smart Tab Organizer',
      columnLocalRegex: 'Extensiones regex locales',
      columnAiTools: 'Herramientas de nombrado por IA',
      rows: [
        {
          criterion: 'Nombre de grupo',
          sto: { state: 'yes', text: 'Extraído de la URL o del título' },
          localRegex: { state: 'no', text: 'Fijo, una regla por valor' },
          aiTools: { state: 'no', text: 'Generado por IA remota' },
        },
        {
          criterion: 'Datos enviados en línea',
          sto: { state: 'yes', text: 'Ninguno' },
          localRegex: { state: 'yes', text: 'Ninguno' },
          aiTools: { state: 'no', text: 'URL y título enviados a un tercero' },
        },
        {
          criterion: 'Precio',
          sto: { state: 'yes', text: 'Gratis, código abierto GPLv3' },
          localRegex: { state: 'neutral', text: 'A menudo gratis' },
          aiTools: { state: 'neutral', text: 'A menudo freemium' },
        },
        {
          criterion: 'Código fuente',
          sto: { state: 'yes', text: 'Código abierto (GPLv3)' },
          localRegex: { state: 'neutral', text: 'Variable' },
          aiTools: { state: 'neutral', text: 'Variable' },
        },
        {
          criterion: 'Accesibilidad',
          sto: { state: 'yes', text: 'Fuentes dys, auditorías axe-core' },
          localRegex: { state: 'neutral', text: 'Variable' },
          aiTools: { state: 'neutral', text: 'Variable' },
        },
      ],
    },
    values: {
      title: 'Valores, no solo funciones',
      subtitle: 'Lo que guía cada decisión de diseño.',
      items: [
        {
          icon: 'flat-color-icons:copyleft',
          title: 'Código abierto',
          description:
            'Código abierto, verificable y al que puedes contribuir. Sabes exactamente qué hace la extensión, línea por línea.',
        },
        {
          icon: 'flat-color-icons:reading',
          title: 'Accesibilidad',
          description:
            'Fuentes adaptadas a la dislexia (Luciole, Atkinson Hyperlegible), foco visible, auditorías axe-core continuas.',
        },
        {
          icon: 'flat-color-icons:donate',
          title: 'Gratis para siempre',
          description:
            'Sin versión de pago, sin nivel premium, sin funciones bloqueadas. Todo, gratis, de forma duradera.',
        },
      ],
    },
    showcase: {
      title: 'Un vistazo en imágenes',
      subtitle: 'Tus reglas agrupan las pestañas, tus sesiones guardan tus contextos de trabajo.',
      items: [
        {
          screen: 'journey-rules-list-populated',
          alt: 'Página de Opciones de SmartTab Organizer mostrando una lista de reglas de dominio.',
          caption: 'Reglas de dominio que agrupan tus pestañas automáticamente.',
        },
        {
          screen: 'journey-sessions-list-with-snapshot',
          alt: 'Lista de sesiones de SmartTab Organizer con una instantánea guardada.',
          caption: 'Tus sesiones de trabajo, guardadas y restaurables con un clic.',
        },
      ],
    },
    cta: {
      title: 'Recupera el control de tus pestañas',
      subtitle: 'Instalación en segundos, sin cuenta ni configuración obligatoria.',
      install: 'Instalar',
      installPath: '/decouverte/installation',
      github: 'Ver en GitHub',
      githubHref: GITHUB_URL,
      chrome: 'Añadir a Chrome',
      chromeHref: CHROME_URL,
      firefox: 'Añadir a Firefox',
      firefoxHref: FIREFOX_URL,
    },
  },
};
