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
}

export const QUICK_ACTIONS: ReadonlyArray<QuickActionDef> = [
  { id: 'organize',   icon: Wand2,     titleKey: 'homepageQuickOrganizeTitle',   descKey: 'homepageQuickOrganizeDesc' },
  { id: 'snapshot',   icon: Camera,    titleKey: 'homepageQuickSnapshotTitle',   descKey: 'homepageQuickSnapshotDesc' },
  { id: 'rule',       icon: Plus,      titleKey: 'homepageQuickRuleTitle',       descKey: 'homepageQuickRuleDesc' },
  { id: 'io',         icon: Upload,    titleKey: 'homepageQuickIoTitle',         descKey: 'homepageQuickIoDesc' },
  { id: 'stats',      icon: BarChart3, titleKey: 'homepageQuickStatsTitle',      descKey: 'homepageQuickStatsDesc' },
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
  { id: 't1', icon: Layers,    titleKey: 'homepageTipsT1Title', textKey: 'homepageTipsT1Text' },
  { id: 't2', icon: Pin,       titleKey: 'homepageTipsT2Title', textKey: 'homepageTipsT2Text' },
  { id: 't3', icon: Wand2,     titleKey: 'homepageTipsT3Title', textKey: 'homepageTipsT3Text' },
  { id: 't4', icon: Package,   titleKey: 'homepageTipsT4Title', textKey: 'homepageTipsT4Text' },
  { id: 't5', icon: EyeOff,    titleKey: 'homepageTipsT5Title', textKey: 'homepageTipsT5Text' },
];

// Re-exports utiles pour les sections
export { Lightbulb };
