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
  /** true => positive (green check), false => negative (red cross). */
  ok: boolean;
  text: string;
}

export interface ComparisonRow {
  criterion: string;
  sto: ComparisonCell;
  others: ComparisonCell;
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
    columnOthers: string;
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
        'Six fonctions complementaires pour transformer un navigateur surcharge en outil de travail organise.',
      items: [
        {
          icon: 'flat-color-icons:tree-structure',
          title: 'Groupement automatique',
          description:
            "Les onglets ouverts depuis un meme parent rejoignent un groupe colore, selon vos regles, sans intervention manuelle.",
        },
        {
          icon: 'flat-color-icons:reuse',
          title: 'Deduplication',
          description:
            'Trois modes de correspondance (URL exacte, sans parametres ignores, inclusion) ferment les doublons en gardant le bon onglet.',
        },
        {
          icon: 'flat-color-icons:data-backup',
          title: 'Sessions et profils',
          description:
            "Capturez l'etat du navigateur, epinglez les contextes recurrents, restaurez-les en un clic avec resolution des conflits.",
        },
        {
          icon: 'flat-color-icons:rules',
          title: 'Regles et packs regex',
          description:
            "Ecrivez vos expressions regulieres ou partez de 49 packs prets a l'emploi, classes par categorie.",
        },
        {
          icon: 'flat-color-icons:data-configuration',
          title: 'Import et export',
          description:
            'Sauvegardez et partagez vos regles et sessions en JSON valide, avec detection et resolution des conflits.',
        },
        {
          icon: 'flat-color-icons:briefcase',
          title: 'Espaces de travail',
          description:
            "Separez travail et perso via des espaces distincts, chacun avec sa couleur d'accent et son exclusivite de fenetre.",
        },
      ],
    },
    privacy: {
      title: 'Tout est local, rien ne part en ligne',
      subtitle:
        "L'inverse exact des outils qui envoient vos URL a un service distant. Ici, vos donnees ne quittent jamais le navigateur.",
      points: [
        { icon: 'flat-color-icons:data-protection', label: 'Stockage dans browser.storage.local, sur votre machine.' },
        { icon: 'flat-color-icons:broken-link', label: 'Zero requete reseau initiee par l\'extension.' },
        { icon: 'flat-color-icons:privacy', label: 'Zero telemetrie, zero analytics, zero pistage.' },
        { icon: 'flat-color-icons:lock', label: 'Zero compte, zero cloud, zero IA distante.' },
      ],
      note: 'Si vous synchronisez vos profils Chrome ou Firefox, les donnees suivent le profil, mais aucune communication reseau n\'est initiee par l\'extension elle-meme.',
    },
    comparison: {
      title: 'Pourquoi pas une alternative ?',
      subtitle:
        'Comparaison avec les categories courantes : gestionnaires cloud, outils de nommage par IA, extensions a abonnement.',
      columnCriterion: 'Critere',
      columnSto: 'Smart Tab Organizer',
      columnOthers: 'Alternatives courantes',
      rows: [
        {
          criterion: 'Stockage des donnees',
          sto: { ok: true, text: '100% local' },
          others: { ok: false, text: 'Souvent dans le cloud' },
        },
        {
          criterion: 'Prix',
          sto: { ok: true, text: 'Gratuit, pour toujours' },
          others: { ok: false, text: 'Freemium ou abonnement' },
        },
        {
          criterion: 'Code source',
          sto: { ok: true, text: 'Open source' },
          others: { ok: false, text: 'Souvent proprietaire' },
        },
        {
          criterion: 'Compte utilisateur',
          sto: { ok: true, text: 'Aucun compte' },
          others: { ok: false, text: 'Compte souvent requis' },
        },
        {
          criterion: 'Tracking et telemetrie',
          sto: { ok: true, text: 'Aucun' },
          others: { ok: false, text: 'Frequent' },
        },
        {
          criterion: 'Nommage des groupes',
          sto: { ok: true, text: 'Regles regex locales' },
          others: { ok: false, text: 'IA distante (URL envoyees)' },
        },
        {
          criterion: 'Accessibilite',
          sto: { ok: true, text: 'Polices dys, audits axe-core' },
          others: { ok: false, text: 'Variable' },
        },
      ],
    },
    values: {
      title: 'Des valeurs, pas seulement des fonctions',
      subtitle: 'Ce qui guide chaque decision de conception.',
      items: [
        {
          icon: 'flat-color-icons:copyleft',
          title: 'Open source',
          description:
            'Code ouvert, verifiable et contribuable. Vous savez exactement ce que fait l\'extension, ligne par ligne.',
        },
        {
          icon: 'flat-color-icons:reading',
          title: 'Accessibilite',
          description:
            'Polices adaptees aux troubles dys (Luciole, Atkinson Hyperlegible), focus visibles, audits axe-core en continu.',
        },
        {
          icon: 'flat-color-icons:donate',
          title: 'Gratuit pour toujours',
          description:
            'Pas de version payante, pas de palier premium, pas de fonction bridee. Tout, gratuitement, durablement.',
        },
      ],
    },
    showcase: {
      title: 'Un apercu en images',
      subtitle: 'Vos regles groupent les onglets, vos sessions sauvegardent vos contextes de travail.',
      items: [
        {
          screen: 'journey-rules-list-populated',
          alt: 'Page Options de SmartTab Organizer affichant une liste de regles de domaine.',
          caption: 'Des regles de domaine qui groupent vos onglets automatiquement.',
        },
        {
          screen: 'journey-sessions-list-with-snapshot',
          alt: 'Liste des sessions de SmartTab Organizer avec un instantane enregistre.',
          caption: 'Vos sessions de travail, sauvegardees et restaurables en un clic.',
        },
      ],
    },
    cta: {
      title: 'Reprenez le controle de vos onglets',
      subtitle: 'Installation en quelques secondes, sans compte ni configuration obligatoire.',
      install: 'Installer',
      installPath: '/decouverte/installation',
      github: 'Voir sur GitHub',
      githubHref: GITHUB_URL,
      chrome: 'Ajouter a Chrome',
      chromeHref: CHROME_URL,
      firefox: 'Ajouter a Firefox',
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
        'The exact opposite of tools that send your URLs to a remote service. Here, your data never leaves the browser.',
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
        'Compared with the usual categories: cloud managers, AI naming tools, subscription extensions.',
      columnCriterion: 'Criterion',
      columnSto: 'Smart Tab Organizer',
      columnOthers: 'Common alternatives',
      rows: [
        {
          criterion: 'Data storage',
          sto: { ok: true, text: '100% local' },
          others: { ok: false, text: 'Often in the cloud' },
        },
        {
          criterion: 'Price',
          sto: { ok: true, text: 'Free, forever' },
          others: { ok: false, text: 'Freemium or subscription' },
        },
        {
          criterion: 'Source code',
          sto: { ok: true, text: 'Open source' },
          others: { ok: false, text: 'Often proprietary' },
        },
        {
          criterion: 'User account',
          sto: { ok: true, text: 'No account' },
          others: { ok: false, text: 'Account often required' },
        },
        {
          criterion: 'Tracking and telemetry',
          sto: { ok: true, text: 'None' },
          others: { ok: false, text: 'Frequent' },
        },
        {
          criterion: 'Group naming',
          sto: { ok: true, text: 'Local regex rules' },
          others: { ok: false, text: 'Remote AI (URLs sent)' },
        },
        {
          criterion: 'Accessibility',
          sto: { ok: true, text: 'Dys fonts, axe-core audits' },
          others: { ok: false, text: 'Varies' },
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
      title: 'Todo lo que tus pestanas necesitan',
      subtitle:
        'Seis funciones complementarias que convierten un navegador sobrecargado en una herramienta de trabajo organizada.',
      items: [
        {
          icon: 'flat-color-icons:tree-structure',
          title: 'Agrupacion automatica',
          description:
            'Las pestanas abiertas desde un mismo padre se unen a un grupo de color, segun tus reglas, sin intervencion manual.',
        },
        {
          icon: 'flat-color-icons:reuse',
          title: 'Deduplicacion',
          description:
            'Tres modos de coincidencia (URL exacta, sin parametros ignorados, inclusion) cierran los duplicados conservando la pestana correcta.',
        },
        {
          icon: 'flat-color-icons:data-backup',
          title: 'Sesiones y perfiles',
          description:
            'Captura el estado del navegador, fija los contextos recurrentes, restauralos con un clic y resolucion de conflictos.',
        },
        {
          icon: 'flat-color-icons:rules',
          title: 'Reglas y paquetes regex',
          description:
            'Escribe tus expresiones regulares o parte de 49 paquetes listos para usar, ordenados por categoria.',
        },
        {
          icon: 'flat-color-icons:data-configuration',
          title: 'Importar y exportar',
          description:
            'Guarda y comparte tus reglas y sesiones en JSON validado, con deteccion y resolucion de conflictos.',
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
        'Lo contrario exacto de las herramientas que envian tus URL a un servicio remoto. Aqui, tus datos nunca salen del navegador.',
      points: [
        { icon: 'flat-color-icons:data-protection', label: 'Almacenamiento en browser.storage.local, en tu equipo.' },
        { icon: 'flat-color-icons:broken-link', label: 'Cero solicitudes de red iniciadas por la extension.' },
        { icon: 'flat-color-icons:privacy', label: 'Cero telemetria, cero analiticas, cero rastreo.' },
        { icon: 'flat-color-icons:lock', label: 'Cero cuenta, cero nube, cero IA remota.' },
      ],
      note: 'Si sincronizas tus perfiles de Chrome o Firefox, los datos siguen al perfil, pero la extension nunca inicia ninguna comunicacion de red por si misma.',
    },
    comparison: {
      title: 'Por que no una alternativa?',
      subtitle:
        'Comparacion con las categorias habituales: gestores en la nube, herramientas de nombrado por IA, extensiones de suscripcion.',
      columnCriterion: 'Criterio',
      columnSto: 'Smart Tab Organizer',
      columnOthers: 'Alternativas habituales',
      rows: [
        {
          criterion: 'Almacenamiento de datos',
          sto: { ok: true, text: '100% local' },
          others: { ok: false, text: 'A menudo en la nube' },
        },
        {
          criterion: 'Precio',
          sto: { ok: true, text: 'Gratis, para siempre' },
          others: { ok: false, text: 'Freemium o suscripcion' },
        },
        {
          criterion: 'Codigo fuente',
          sto: { ok: true, text: 'Codigo abierto' },
          others: { ok: false, text: 'A menudo propietario' },
        },
        {
          criterion: 'Cuenta de usuario',
          sto: { ok: true, text: 'Sin cuenta' },
          others: { ok: false, text: 'Cuenta a menudo requerida' },
        },
        {
          criterion: 'Rastreo y telemetria',
          sto: { ok: true, text: 'Ninguno' },
          others: { ok: false, text: 'Frecuente' },
        },
        {
          criterion: 'Nombrado de grupos',
          sto: { ok: true, text: 'Reglas regex locales' },
          others: { ok: false, text: 'IA remota (URL enviadas)' },
        },
        {
          criterion: 'Accesibilidad',
          sto: { ok: true, text: 'Fuentes dys, auditorias axe-core' },
          others: { ok: false, text: 'Variable' },
        },
      ],
    },
    values: {
      title: 'Valores, no solo funciones',
      subtitle: 'Lo que guia cada decision de diseno.',
      items: [
        {
          icon: 'flat-color-icons:copyleft',
          title: 'Codigo abierto',
          description:
            'Codigo abierto, verificable y al que puedes contribuir. Sabes exactamente que hace la extension, linea por linea.',
        },
        {
          icon: 'flat-color-icons:reading',
          title: 'Accesibilidad',
          description:
            'Fuentes adaptadas a la dislexia (Luciole, Atkinson Hyperlegible), foco visible, auditorias axe-core continuas.',
        },
        {
          icon: 'flat-color-icons:donate',
          title: 'Gratis para siempre',
          description:
            'Sin version de pago, sin nivel premium, sin funciones bloqueadas. Todo, gratis, de forma duradera.',
        },
      ],
    },
    showcase: {
      title: 'Un vistazo en imagenes',
      subtitle: 'Tus reglas agrupan las pestanas, tus sesiones guardan tus contextos de trabajo.',
      items: [
        {
          screen: 'journey-rules-list-populated',
          alt: 'Pagina de Opciones de SmartTab Organizer mostrando una lista de reglas de dominio.',
          caption: 'Reglas de dominio que agrupan tus pestanas automaticamente.',
        },
        {
          screen: 'journey-sessions-list-with-snapshot',
          alt: 'Lista de sesiones de SmartTab Organizer con una instantanea guardada.',
          caption: 'Tus sesiones de trabajo, guardadas y restaurables con un clic.',
        },
      ],
    },
    cta: {
      title: 'Recupera el control de tus pestanas',
      subtitle: 'Instalacion en segundos, sin cuenta ni configuracion obligatoria.',
      install: 'Instalar',
      installPath: '/decouverte/installation',
      github: 'Ver en GitHub',
      githubHref: GITHUB_URL,
      chrome: 'Anadir a Chrome',
      chromeHref: CHROME_URL,
      firefox: 'Anadir a Firefox',
      firefoxHref: FIREFOX_URL,
    },
  },
};
