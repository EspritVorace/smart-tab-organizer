import { describe, it, expect } from 'vitest';
import {
  type ConfigFields,
  type ConfigSnapshots,
  EMPTY_CONFIG_SNAPSHOTS,
  applyPresetSelection,
  enterModePatch,
  inferConfigMode,
  initSnapshots,
  saveModeSnapshot,
} from '../../src/components/Core/DomainRule/configModeState';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const makeFields = (overrides: Partial<ConfigFields> = {}): ConfigFields => ({
  presetId: null,
  groupNameSource: 'title',
  titleParsingRegEx: '',
  urlParsingRegEx: '',
  urlExtractionMode: 'regex',
  urlQueryParamName: '',
  fallbackLabel: '',
  ...overrides,
});

/**
 * Simulate a full modal session driven only by the pure helpers: apply each mode
 * change as the components do (save the leaving mode, then apply the enter patch).
 */
function switchMode(
  snapshots: ConfigSnapshots,
  fields: ConfigFields,
  from: Parameters<typeof saveModeSnapshot>[1],
  to: Parameters<typeof enterModePatch>[1],
): { snapshots: ConfigSnapshots; fields: ConfigFields } {
  const saved = from !== to ? saveModeSnapshot(snapshots, from, fields) : snapshots;
  const patch = enterModePatch(saved, to, { label: fields.fallbackLabel, fallbackLabel: fields.fallbackLabel });
  return { snapshots: saved, fields: { ...fields, ...patch } };
}

const PRESET_X = {
  groupNameSource: 'url' as const,
  urlRegex: 'x-(\\d+)',
  urlExtractionMode: 'regex' as const,
};
const PRESET_Y = {
  groupNameSource: 'title' as const,
  titleRegex: 'y-(.+)',
};

/* ── inferConfigMode ────────────────────────────────────────────────────────── */

describe('inferConfigMode', () => {
  it('defaults to preset for a new rule', () => {
    expect(inferConfigMode(undefined)).toBe('preset');
  });
  it('classifies by presetId, then label/manual sentinels, else manual', () => {
    expect(inferConfigMode({ presetId: 'p1', groupNameSource: 'title' })).toBe('preset');
    expect(inferConfigMode({ presetId: null, groupNameSource: 'label' })).toBe('label');
    expect(inferConfigMode({ presetId: null, groupNameSource: 'manual' })).toBe('ask');
    expect(inferConfigMode({ presetId: null, groupNameSource: 'url' })).toBe('manual');
  });
});

/* ── Transition matrix (the core of the user request) ───────────────────────── */

describe('config mode transitions', () => {
  it('preset(X) -> manual carries the preset regex', () => {
    let snapshots = EMPTY_CONFIG_SNAPSHOTS;
    let fields = makeFields();
    // Select preset X while in preset mode.
    const sel = applyPresetSelection(snapshots, 'X', PRESET_X);
    snapshots = sel.snapshots;
    fields = { ...fields, ...sel.fields };
    // preset -> manual
    ({ snapshots, fields } = switchMode(snapshots, fields, 'preset', 'manual'));

    expect(fields.presetId).toBeNull();
    expect(fields.groupNameSource).toBe('url');
    expect(fields.urlParsingRegEx).toBe('x-(\\d+)');
  });

  it('preset(X) -> label -> manual still carries the preset regex', () => {
    let snapshots = EMPTY_CONFIG_SNAPSHOTS;
    let fields = makeFields({ fallbackLabel: 'Docs' });
    const sel = applyPresetSelection(snapshots, 'X', PRESET_X);
    snapshots = sel.snapshots;
    fields = { ...fields, ...sel.fields };

    ({ snapshots, fields } = switchMode(snapshots, fields, 'preset', 'label'));
    expect(fields.groupNameSource).toBe('label');
    expect(fields.urlParsingRegEx).toBe(''); // cleared in the form...

    ({ snapshots, fields } = switchMode(snapshots, fields, 'label', 'manual'));
    // ...but restored from the manual snapshot.
    expect(fields.urlParsingRegEx).toBe('x-(\\d+)');
    expect(fields.groupNameSource).toBe('url');
  });

  it('preset(X) -> ask -> manual still carries the preset regex', () => {
    let snapshots = EMPTY_CONFIG_SNAPSHOTS;
    let fields = makeFields();
    const sel = applyPresetSelection(snapshots, 'X', PRESET_X);
    snapshots = sel.snapshots;
    fields = { ...fields, ...sel.fields };

    ({ snapshots, fields } = switchMode(snapshots, fields, 'preset', 'ask'));
    expect(fields.groupNameSource).toBe('manual');

    ({ snapshots, fields } = switchMode(snapshots, fields, 'ask', 'manual'));
    expect(fields.urlParsingRegEx).toBe('x-(\\d+)');
    expect(fields.groupNameSource).toBe('url');
  });

  it('manual(custom) -> label -> manual preserves the custom regex', () => {
    let snapshots = initSnapshots(makeFields(), 'manual');
    let fields = makeFields({ groupNameSource: 'title', titleParsingRegEx: 'custom-(.+)' });

    ({ snapshots, fields } = switchMode(snapshots, fields, 'manual', 'label'));
    expect(fields.titleParsingRegEx).toBe('');

    ({ snapshots, fields } = switchMode(snapshots, fields, 'label', 'manual'));
    expect(fields.titleParsingRegEx).toBe('custom-(.+)');
    expect(fields.groupNameSource).toBe('title');
  });

  it('manual(custom) -> preset(Y) -> manual shows Y (preset reseeds manual)', () => {
    let snapshots = initSnapshots(makeFields(), 'manual');
    let fields = makeFields({ groupNameSource: 'title', titleParsingRegEx: 'custom-(.+)' });

    // manual -> preset
    ({ snapshots, fields } = switchMode(snapshots, fields, 'manual', 'preset'));
    // Select preset Y in preset mode.
    const sel = applyPresetSelection(snapshots, 'Y', PRESET_Y);
    snapshots = sel.snapshots;
    fields = { ...fields, ...sel.fields };
    // preset -> manual
    ({ snapshots, fields } = switchMode(snapshots, fields, 'preset', 'manual'));

    expect(fields.titleParsingRegEx).toBe('y-(.+)');
    expect(fields.groupNameSource).toBe('title');
  });

  it('label fallbackLabel is preserved across label -> manual -> label', () => {
    let snapshots = EMPTY_CONFIG_SNAPSHOTS;
    let fields = makeFields();

    ({ snapshots, fields } = switchMode(snapshots, fields, 'preset', 'label'));
    fields = { ...fields, fallbackLabel: 'My Group' };

    ({ snapshots, fields } = switchMode(snapshots, fields, 'label', 'manual'));
    expect(fields.fallbackLabel).toBe('My Group'); // shared field, never cleared

    ({ snapshots, fields } = switchMode(snapshots, fields, 'manual', 'label'));
    expect(fields.fallbackLabel).toBe('My Group');
    expect(fields.groupNameSource).toBe('label');
  });

  it('entering label seeds fallbackLabel from the rule label only when empty', () => {
    const seeded = enterModePatch(EMPTY_CONFIG_SNAPSHOTS, 'label', { label: 'RuleLabel', fallbackLabel: '' });
    expect(seeded.fallbackLabel).toBe('RuleLabel');

    const kept = enterModePatch(EMPTY_CONFIG_SNAPSHOTS, 'label', { label: 'RuleLabel', fallbackLabel: 'Existing' });
    expect(kept.fallbackLabel).toBe('Existing');
  });
});

/* ── groupNameSource sanitization ───────────────────────────────────────────── */

describe('manual mode source sanitization', () => {
  it('coerces a label/manual snapshot source back to title when entering manual', () => {
    const labelSnapshots: ConfigSnapshots = {
      ...EMPTY_CONFIG_SNAPSHOTS,
      manual: { ...EMPTY_CONFIG_SNAPSHOTS.manual, groupNameSource: 'label' },
    };
    expect(enterModePatch(labelSnapshots, 'manual', { label: '', fallbackLabel: '' }).groupNameSource).toBe('title');

    const manualSnapshots: ConfigSnapshots = {
      ...EMPTY_CONFIG_SNAPSHOTS,
      manual: { ...EMPTY_CONFIG_SNAPSHOTS.manual, groupNameSource: 'manual' },
    };
    expect(enterModePatch(manualSnapshots, 'manual', { label: '', fallbackLabel: '' }).groupNameSource).toBe('title');
  });
});

/* ── initSnapshots ──────────────────────────────────────────────────────────── */

describe('initSnapshots', () => {
  it('seeds both preset and manual snapshots for a preset rule', () => {
    const snapshots = initSnapshots(
      makeFields({ presetId: 'X', groupNameSource: 'url', urlParsingRegEx: 'x-(\\d+)' }),
      'preset',
    );
    expect(snapshots.preset.presetId).toBe('X');
    expect(snapshots.preset.urlParsingRegEx).toBe('x-(\\d+)');
    expect(snapshots.manual.urlParsingRegEx).toBe('x-(\\d+)');
  });

  it('seeds the manual snapshot for a manual rule', () => {
    const snapshots = initSnapshots(
      makeFields({ groupNameSource: 'title', titleParsingRegEx: 'm-(.+)' }),
      'manual',
    );
    expect(snapshots.manual.titleParsingRegEx).toBe('m-(.+)');
    expect(snapshots.preset.presetId).toBeNull();
  });

  it('yields empty manual snapshot for a label rule (no stuck label source)', () => {
    const snapshots = initSnapshots(
      makeFields({ groupNameSource: 'label', fallbackLabel: 'L' }),
      'label',
    );
    expect(snapshots.manual.groupNameSource).toBe('title');
    expect(snapshots.manual.titleParsingRegEx).toBe('');
  });

  it('yields empty manual snapshot for an ask rule', () => {
    const snapshots = initSnapshots(makeFields({ groupNameSource: 'manual' }), 'ask');
    expect(snapshots.manual.groupNameSource).toBe('title');
    expect(snapshots.preset.presetId).toBeNull();
  });
});
