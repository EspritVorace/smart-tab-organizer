import { describe, it, expect, beforeEach } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { markShortcutCapability } from '../../src/exploration/shortcutCapabilities';
import { getExplorationProgress, flushExplorationWrites, _resetExplorationStoreForTests } from '../../src/exploration/progressStore';

beforeEach(() => {
  fakeBrowser.reset();
  _resetExplorationStoreForTests();
});

async function discoveredAfter(shortcutId: string): Promise<string[]> {
  markShortcutCapability(shortcutId);
  await flushExplorationWrites();
  return (await getExplorationProgress()).discovered;
}

describe('markShortcutCapability', () => {
  it('maps a specific id (search focus) to its capability', async () => {
    expect(await discoveredAfter('options.search.focus')).toContain('nav.globalSearch');
  });

  it('maps the help shortcut to the help drawer', async () => {
    expect(await discoveredAfter('options.help')).toContain('help.drawer');
  });

  it('maps F1 docs to contextual help', async () => {
    expect(await discoveredAfter('options.docs.open')).toContain('help.contextF1');
  });

  it('maps an options mnemonic (by group) to nav.mnemonics', async () => {
    expect(await discoveredAfter('options.nav.home')).toContain('nav.mnemonics');
  });

  it('maps a workspace sequence to keyboard switch and switch capabilities', async () => {
    const discovered = await discoveredAfter('workspace.next');
    expect(discovered).toContain('nav.workspaceSwitchKeyboard');
    expect(discovered).toContain('workspaces.switch');
  });

  it('maps session section navigation to sessions.sectionNav', async () => {
    expect(await discoveredAfter('sessionCard.sectionNext')).toContain('sessions.sectionNav');
  });

  it('maps stats tab navigation to stats.tabNav', async () => {
    expect(await discoveredAfter('list.stats.tabNext')).toContain('stats.tabNav');
  });

  it('ignores an unknown shortcut id', async () => {
    expect(await discoveredAfter('does.not.exist')).toEqual([]);
  });
});
