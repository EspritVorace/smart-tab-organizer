import {
  Wand2,
  Camera,
  Plus,
  Upload,
  BarChart3,
  Settings,
  Layers,
  Pin,
  Lightbulb,
  Package,
  EyeOff,
  Regex,
  GripVertical,
  Palette,
  CheckSquare,
  StickyNote,
  Code2,
  Tag,
  Sparkles,
  Filter,
  Save,
  Hash,
  Undo2,
  Unlock,
  Activity,
  Pencil,
  Workflow,
  ChevronDown,
  Bookmark,
  NotepadText,
  Boxes,
  Folder,
  Brush,
  FileJson,
  Clipboard,
  GitCompare,
  FileText,
  Shield,
  Keyboard,
  Command,
  Zap,
  Globe,
  Search,
  TrendingUp,
  Sun,
  Languages,
  Accessibility,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type QuickActionId =
  | 'organize'
  | 'snapshot'
  | 'rule'
  | 'io'
  | 'stats'
  | 'shortcuts'
  | 'workspaces';

export interface QuickActionDef {
  id: QuickActionId;
  icon: LucideIcon;
  titleKey: string;
  descKey: string;
  /** Single-key shortcut letter rendered as a kbd badge on the card. */
  shortcutLetter?: string;
}

export const QUICK_ACTIONS: ReadonlyArray<QuickActionDef> = [
  { id: 'organize',   icon: Wand2,     titleKey: 'homepageQuickOrganizeTitle',   descKey: 'homepageQuickOrganizeDesc',   shortcutLetter: 'o' },
  { id: 'snapshot',   icon: Camera,    titleKey: 'homepageQuickSnapshotTitle',   descKey: 'homepageQuickSnapshotDesc',   shortcutLetter: 's' },
  { id: 'rule',       icon: Plus,      titleKey: 'homepageQuickRuleTitle',       descKey: 'homepageQuickRuleDesc',       shortcutLetter: 'n' },
  { id: 'io',         icon: Upload,    titleKey: 'homepageQuickIoTitle',         descKey: 'homepageQuickIoDesc',         shortcutLetter: 'i' },
  { id: 'stats',      icon: BarChart3, titleKey: 'homepageQuickStatsTitle',      descKey: 'homepageQuickStatsDesc',      shortcutLetter: 't' },
  { id: 'shortcuts',  icon: Settings,  titleKey: 'homepageQuickShortcutsTitle',  descKey: 'homepageQuickShortcutsDesc' },
  { id: 'workspaces', icon: Layers,    titleKey: 'homepageQuickWorkspacesTitle', descKey: 'homepageQuickWorkspacesDesc' },
];

export interface TipDef {
  id: string;
  icon: LucideIcon;
  titleKey: string;
  textKey: string;
}

export const TIPS: ReadonlyArray<TipDef> = [
  { id: 't1',  icon: Layers,        titleKey: 'homepageTipsT1Title',  textKey: 'homepageTipsT1Text' },
  { id: 't2',  icon: Pin,           titleKey: 'homepageTipsT2Title',  textKey: 'homepageTipsT2Text' },
  { id: 't3',  icon: Wand2,         titleKey: 'homepageTipsT3Title',  textKey: 'homepageTipsT3Text' },
  { id: 't4',  icon: Package,       titleKey: 'homepageTipsT4Title',  textKey: 'homepageTipsT4Text' },
  { id: 't5',  icon: EyeOff,        titleKey: 'homepageTipsT5Title',  textKey: 'homepageTipsT5Text' },
  { id: 't6',  icon: Regex,         titleKey: 'homepageTipsT6Title',  textKey: 'homepageTipsT6Text' },
  { id: 't7',  icon: GripVertical,  titleKey: 'homepageTipsT7Title',  textKey: 'homepageTipsT7Text' },
  { id: 't8',  icon: Palette,       titleKey: 'homepageTipsT8Title',  textKey: 'homepageTipsT8Text' },
  { id: 't9',  icon: CheckSquare,   titleKey: 'homepageTipsT9Title',  textKey: 'homepageTipsT9Text' },
  { id: 't10', icon: StickyNote,    titleKey: 'homepageTipsT10Title', textKey: 'homepageTipsT10Text' },
  { id: 't11', icon: Code2,         titleKey: 'homepageTipsT11Title', textKey: 'homepageTipsT11Text' },
  { id: 't12', icon: Tag,           titleKey: 'homepageTipsT12Title', textKey: 'homepageTipsT12Text' },
  { id: 't13', icon: Sparkles,      titleKey: 'homepageTipsT13Title', textKey: 'homepageTipsT13Text' },
  { id: 't14', icon: Filter,        titleKey: 'homepageTipsT14Title', textKey: 'homepageTipsT14Text' },
  { id: 't15', icon: Save,          titleKey: 'homepageTipsT15Title', textKey: 'homepageTipsT15Text' },
  { id: 't16', icon: Hash,          titleKey: 'homepageTipsT16Title', textKey: 'homepageTipsT16Text' },
  { id: 't17', icon: Undo2,         titleKey: 'homepageTipsT17Title', textKey: 'homepageTipsT17Text' },
  { id: 't18', icon: Unlock,        titleKey: 'homepageTipsT18Title', textKey: 'homepageTipsT18Text' },
  { id: 't19', icon: Activity,      titleKey: 'homepageTipsT19Title', textKey: 'homepageTipsT19Text' },
  { id: 't20', icon: Camera,        titleKey: 'homepageTipsT20Title', textKey: 'homepageTipsT20Text' },
  { id: 't21', icon: Pencil,        titleKey: 'homepageTipsT21Title', textKey: 'homepageTipsT21Text' },
  { id: 't22', icon: Workflow,      titleKey: 'homepageTipsT22Title', textKey: 'homepageTipsT22Text' },
  { id: 't23', icon: ChevronDown,   titleKey: 'homepageTipsT23Title', textKey: 'homepageTipsT23Text' },
  { id: 't24', icon: Bookmark,      titleKey: 'homepageTipsT24Title', textKey: 'homepageTipsT24Text' },
  { id: 't25', icon: NotepadText,   titleKey: 'homepageTipsT25Title', textKey: 'homepageTipsT25Text' },
  { id: 't26', icon: Pin,           titleKey: 'homepageTipsT26Title', textKey: 'homepageTipsT26Text' },
  { id: 't27', icon: Boxes,         titleKey: 'homepageTipsT27Title', textKey: 'homepageTipsT27Text' },
  { id: 't28', icon: Folder,        titleKey: 'homepageTipsT28Title', textKey: 'homepageTipsT28Text' },
  { id: 't29', icon: Brush,         titleKey: 'homepageTipsT29Title', textKey: 'homepageTipsT29Text' },
  { id: 't30', icon: FileJson,      titleKey: 'homepageTipsT30Title', textKey: 'homepageTipsT30Text' },
  { id: 't31', icon: Clipboard,     titleKey: 'homepageTipsT31Title', textKey: 'homepageTipsT31Text' },
  { id: 't32', icon: GitCompare,    titleKey: 'homepageTipsT32Title', textKey: 'homepageTipsT32Text' },
  { id: 't33', icon: FileText,      titleKey: 'homepageTipsT33Title', textKey: 'homepageTipsT33Text' },
  { id: 't34', icon: Shield,        titleKey: 'homepageTipsT34Title', textKey: 'homepageTipsT34Text' },
  { id: 't35', icon: Keyboard,      titleKey: 'homepageTipsT35Title', textKey: 'homepageTipsT35Text' },
  { id: 't36', icon: Command,       titleKey: 'homepageTipsT36Title', textKey: 'homepageTipsT36Text' },
  { id: 't37', icon: Zap,           titleKey: 'homepageTipsT37Title', textKey: 'homepageTipsT37Text' },
  { id: 't38', icon: Globe,         titleKey: 'homepageTipsT38Title', textKey: 'homepageTipsT38Text' },
  { id: 't39', icon: Search,        titleKey: 'homepageTipsT39Title', textKey: 'homepageTipsT39Text' },
  { id: 't40', icon: BarChart3,     titleKey: 'homepageTipsT40Title', textKey: 'homepageTipsT40Text' },
  { id: 't41', icon: TrendingUp,    titleKey: 'homepageTipsT41Title', textKey: 'homepageTipsT41Text' },
  { id: 't42', icon: Sun,           titleKey: 'homepageTipsT42Title', textKey: 'homepageTipsT42Text' },
  { id: 't43', icon: Languages,     titleKey: 'homepageTipsT43Title', textKey: 'homepageTipsT43Text' },
  { id: 't44', icon: Accessibility, titleKey: 'homepageTipsT44Title', textKey: 'homepageTipsT44Text' },
];

// Re-exports utiles pour les sections
export { Lightbulb };
