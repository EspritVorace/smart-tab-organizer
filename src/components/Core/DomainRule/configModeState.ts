import type { GroupNameSourceValue, UrlExtractionModeValue } from '@/schemas/enums';
import type { ConfigMode } from './ConfigModeSelector';

/**
 * Pure state machine for the rule "configuration mode" selector (preset / manual /
 * label / ask) shared by RuleWizardModal (react-hook-form driven) and
 * ConfigEditModal (useState driven).
 *
 * Each mode keeps its own internal snapshot for the lifetime of a modal session.
 * The only intentional cross-mode bleed is preset -> manual: selecting/changing a
 * preset reseeds the manual snapshot from that preset. Merely passing through
 * `label` or `ask` never disturbs the manual snapshot.
 *
 * `fallbackLabel` is a shared field (group name in label mode, fallback in manual
 * mode) so it is never snapshotted/cleared per mode. `ask` carries no editable
 * state. Only `manual` and `preset` need a snapshot.
 */

/** The regex-related fields a manual/preset snapshot tracks. */
export interface ModeSnapshot {
  groupNameSource: GroupNameSourceValue;
  titleParsingRegEx: string;
  urlParsingRegEx: string;
  urlExtractionMode: UrlExtractionModeValue;
  urlQueryParamName: string;
}

export interface PresetSnapshot extends ModeSnapshot {
  presetId: string | null;
}

export interface ConfigSnapshots {
  manual: ModeSnapshot;
  preset: PresetSnapshot;
}

/** Mutable configuration fields the transitions read from / write to. */
export interface ConfigFields extends ModeSnapshot {
  presetId: string | null;
  fallbackLabel: string;
}

/** Minimal preset shape consumed when reseeding from a preset selection. */
export interface PresetSeed {
  groupNameSource: GroupNameSourceValue;
  titleRegex?: string;
  urlRegex?: string;
  urlExtractionMode?: UrlExtractionModeValue;
  urlQueryParamName?: string;
}

export const EMPTY_MODE_SNAPSHOT: ModeSnapshot = {
  groupNameSource: 'title',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  urlExtractionMode: 'regex',
  urlQueryParamName: '',
};

export const EMPTY_PRESET_SNAPSHOT: PresetSnapshot = {
  presetId: null,
  ...EMPTY_MODE_SNAPSHOT,
};

export const EMPTY_CONFIG_SNAPSHOTS: ConfigSnapshots = {
  manual: { ...EMPTY_MODE_SNAPSHOT },
  preset: { ...EMPTY_PRESET_SNAPSHOT },
};

/**
 * `manual` and `label` are not valid sources for manual editing: `manual` is the
 * "ask" sentinel and `label` belongs to label mode. Coerce them back to `title`
 * so entering manual mode always shows an editable source + regex fields.
 */
function sanitizeManualSource(source: GroupNameSourceValue): GroupNameSourceValue {
  return source === 'label' || source === 'manual' ? 'title' : source;
}

/** Extract the regex-related fields from a full ConfigFields object. */
export function extractModeSnapshot(fields: ModeSnapshot): ModeSnapshot {
  return {
    groupNameSource: fields.groupNameSource,
    titleParsingRegEx: fields.titleParsingRegEx,
    urlParsingRegEx: fields.urlParsingRegEx,
    urlExtractionMode: fields.urlExtractionMode,
    urlQueryParamName: fields.urlQueryParamName,
  };
}

/**
 * Classify a rule (or absence of one) into its initial config mode.
 * Mirrors the data model: a preset wins, then the `label`/`manual` group-name
 * sentinels, otherwise it is a hand-written manual rule.
 */
export function inferConfigMode(rule?: {
  presetId?: string | null;
  groupNameSource?: GroupNameSourceValue;
}): ConfigMode {
  if (!rule) return 'preset';
  if (rule.presetId) return 'preset';
  if (rule.groupNameSource === 'label') return 'label';
  if (rule.groupNameSource === 'manual') return 'ask';
  return 'manual';
}

/**
 * Save the current field values into the leaving mode's snapshot.
 * `ask`/`label` have no per-mode snapshot, so they leave the snapshots untouched.
 */
export function saveModeSnapshot(
  snapshots: ConfigSnapshots,
  leavingMode: ConfigMode,
  fields: ConfigFields,
): ConfigSnapshots {
  if (leavingMode === 'manual') {
    return { ...snapshots, manual: extractModeSnapshot(fields) };
  }
  if (leavingMode === 'preset') {
    return { ...snapshots, preset: { presetId: fields.presetId, ...extractModeSnapshot(fields) } };
  }
  return snapshots;
}

/**
 * Compute the partial fields to write when entering a mode. Fields absent from
 * the patch keep their current value (e.g. entering `ask` only touches presetId
 * and groupNameSource).
 */
export function enterModePatch(
  snapshots: ConfigSnapshots,
  enteringMode: ConfigMode,
  context: { label: string; fallbackLabel: string },
): Partial<ConfigFields> {
  switch (enteringMode) {
    case 'preset':
      return { presetId: snapshots.preset.presetId, ...extractModeSnapshot(snapshots.preset) };
    case 'manual':
      return {
        presetId: null,
        ...extractModeSnapshot(snapshots.manual),
        groupNameSource: sanitizeManualSource(snapshots.manual.groupNameSource),
      };
    case 'ask':
      return { presetId: null, groupNameSource: 'manual' };
    case 'label': {
      const hasFallback = context.fallbackLabel.trim() !== '';
      return {
        presetId: null,
        groupNameSource: 'label',
        titleParsingRegEx: '',
        urlParsingRegEx: '',
        urlQueryParamName: '',
        fallbackLabel: hasFallback ? context.fallbackLabel : context.label,
      };
    }
  }
}

/**
 * Selecting/changing a preset reseeds both the preset snapshot and the manual
 * snapshot from the preset, and returns the field patch to apply. This is the
 * single intentional preset -> manual carryover.
 */
export function applyPresetSelection(
  snapshots: ConfigSnapshots,
  presetId: string,
  preset: PresetSeed,
): { snapshots: ConfigSnapshots; fields: Partial<ConfigFields> } {
  const modeSnapshot: ModeSnapshot = {
    groupNameSource: preset.groupNameSource,
    titleParsingRegEx: preset.titleRegex ?? '',
    urlParsingRegEx: preset.urlRegex ?? '',
    urlExtractionMode: preset.urlExtractionMode ?? 'regex',
    urlQueryParamName: preset.urlQueryParamName ?? '',
  };
  return {
    snapshots: {
      manual: { ...modeSnapshot },
      preset: { presetId, ...modeSnapshot },
    },
    fields: { presetId, ...modeSnapshot },
  };
}

/**
 * Build the initial snapshots from the rule being edited (or empty for a new
 * rule). A `label`/`ask` rule yields empty manual/preset snapshots so switching
 * to manual starts from a clean, editable state.
 */
export function initSnapshots(fields: ConfigFields, mode: ConfigMode): ConfigSnapshots {
  const modeSnapshot = extractModeSnapshot(fields);
  if (mode === 'preset') {
    return {
      preset: { presetId: fields.presetId, ...modeSnapshot },
      manual: { ...modeSnapshot, groupNameSource: sanitizeManualSource(modeSnapshot.groupNameSource) },
    };
  }
  if (mode === 'manual') {
    return {
      manual: { ...modeSnapshot, groupNameSource: sanitizeManualSource(modeSnapshot.groupNameSource) },
      preset: { ...EMPTY_PRESET_SNAPSHOT },
    };
  }
  // ask / label: no meaningful manual or preset state to capture from the rule.
  return {
    manual: { ...EMPTY_MODE_SNAPSHOT },
    preset: { ...EMPTY_PRESET_SNAPSHOT },
  };
}
