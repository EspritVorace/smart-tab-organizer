import { describe, it, expect } from 'vitest';
import {
  planSync,
  summarizeSync,
  type PlanSyncInput,
  type SyncPipeline,
} from '../e2e-shared/routing/sync.js';
import type { DestinationTarget, Manifest } from '../e2e-shared/routing/types.js';

const ALL_LOCALES = ['en', 'fr', 'es'] as const;
const ALL_THEMES = ['light', 'dark'] as const;

function emptyDestinationFiles(): Map<DestinationTarget, Set<string>> {
  return new Map<DestinationTarget, Set<string>>([
    ['starlight', new Set()],
    ['readme', new Set()],
    ['chrome-web-store', new Set()],
  ]);
}

function pipeline(overrides: Partial<SyncPipeline> & { id: string; manifest: Manifest }): SyncPipeline {
  return {
    capturesPresent: [],
    locales: [...ALL_LOCALES],
    themes: [...ALL_THEMES],
    ...overrides,
  };
}

describe('planSync', () => {
  it('returns an empty plan when no pipeline declares anything', () => {
    const input: PlanSyncInput = {
      pipelines: [],
      destinationFiles: emptyDestinationFiles(),
    };
    const plan = planSync(input);
    expect(plan.copies).toEqual([]);
    expect(plan.skips).toEqual([]);
    expect(plan.prunes).toEqual([]);
  });

  it('emits one copy per (locale, theme) combo when the source PNG exists', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'rules-list',
          destinations: [
            { target: 'readme', path: 'rules-list', locales: ['en'], themes: ['dark'] },
          ],
        },
      ],
    };
    const input: PlanSyncInput = {
      pipelines: [
        pipeline({
          id: 'demo',
          manifest,
          capturesPresent: [
            {
              capture: 'rules-list',
              locale: 'en',
              theme: 'dark',
              sourcePath: '/abs/source/en/dark/rules-list.png',
            },
          ],
        }),
      ],
      destinationFiles: emptyDestinationFiles(),
    };
    const plan = planSync(input);
    expect(plan.copies).toHaveLength(1);
    expect(plan.copies[0]).toMatchObject({
      pipeline: 'demo',
      capture: 'rules-list',
      locale: 'en',
      theme: 'dark',
      sourcePath: '/abs/source/en/dark/rules-list.png',
      destination: 'readme',
      destinationPath: 'en-dark-rules-list.png',
    });
    expect(plan.skips).toEqual([]);
  });

  it('records a skip when a manifest references a capture that is not on disk', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'rules-list',
          destinations: [
            { target: 'readme', path: 'rules-list', locales: ['en'], themes: ['dark'] },
          ],
        },
      ],
    };
    const input: PlanSyncInput = {
      pipelines: [pipeline({ id: 'demo', manifest })],
      destinationFiles: emptyDestinationFiles(),
    };
    const plan = planSync(input);
    expect(plan.copies).toEqual([]);
    expect(plan.skips).toHaveLength(1);
    expect(plan.skips[0]).toMatchObject({
      pipeline: 'demo',
      capture: 'rules-list',
      locale: 'en',
      theme: 'dark',
      destination: 'readme',
      destinationPath: 'en-dark-rules-list.png',
      reason: 'source-missing',
    });
  });

  it('expands routes that omit locales/themes across the pipeline matrix', () => {
    const manifest: Manifest = {
      routes: [{ capture: 'popup', destinations: [{ target: 'starlight', path: 'popup' }] }],
    };
    const presentCombos = ALL_LOCALES.flatMap((locale) =>
      ALL_THEMES.map((theme) => ({
        capture: 'popup',
        locale,
        theme,
        sourcePath: `/abs/${locale}/${theme}/popup.png`,
      })),
    );
    const input: PlanSyncInput = {
      pipelines: [pipeline({ id: 'demo', manifest, capturesPresent: presentCombos })],
      destinationFiles: emptyDestinationFiles(),
    };
    const plan = planSync(input);
    expect(plan.copies).toHaveLength(ALL_LOCALES.length * ALL_THEMES.length);
    expect(plan.skips).toEqual([]);
  });

  it('substitutes {locale}/{theme} placeholders in destination paths', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'rules',
          destinations: [{ target: 'starlight', path: 'features/{locale}/{theme}/rules' }],
        },
      ],
    };
    const input: PlanSyncInput = {
      pipelines: [
        pipeline({
          id: 'demo',
          manifest,
          locales: ['fr'],
          themes: ['light'],
          capturesPresent: [
            { capture: 'rules', locale: 'fr', theme: 'light', sourcePath: '/abs/fr/light/rules.png' },
          ],
        }),
      ],
      destinationFiles: emptyDestinationFiles(),
    };
    const plan = planSync(input);
    expect(plan.copies).toHaveLength(1);
    expect(plan.copies[0].destinationPath).toBe('features/fr/light/rules.png');
  });

  it('does not return prunes when --prune is off, even with orphan destination files', () => {
    const manifest: Manifest = { routes: [] };
    const input: PlanSyncInput = {
      pipelines: [pipeline({ id: 'demo', manifest })],
      destinationFiles: new Map<DestinationTarget, Set<string>>([
        ['starlight', new Set()],
        ['readme', new Set(['legacy.png'])],
        ['chrome-web-store', new Set()],
      ]),
    };
    const plan = planSync(input);
    expect(plan.prunes).toEqual([]);
  });

  it('flags every destination file not produced by routing as a prune candidate when --prune is on', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'rules',
          destinations: [
            { target: 'readme', path: 'rules', locales: ['en'], themes: ['dark'] },
          ],
        },
      ],
    };
    const input: PlanSyncInput = {
      pipelines: [
        pipeline({
          id: 'demo',
          manifest,
          capturesPresent: [
            { capture: 'rules', locale: 'en', theme: 'dark', sourcePath: '/abs/en/dark/rules.png' },
          ],
        }),
      ],
      destinationFiles: new Map<DestinationTarget, Set<string>>([
        ['starlight', new Set()],
        ['readme', new Set(['en-dark-rules.png', 'legacy.png'])],
        ['chrome-web-store', new Set()],
      ]),
      prune: true,
    };
    const plan = planSync(input);
    expect(plan.prunes).toHaveLength(1);
    expect(plan.prunes[0]).toMatchObject({
      destination: 'readme',
      relativePath: 'legacy.png',
    });
  });

  it('keeps captures landing in a primary destination out of the prune list', () => {
    const manifest: Manifest = { routes: [] };
    const input: PlanSyncInput = {
      pipelines: [
        pipeline({
          id: 'screenshots',
          manifest,
          capturesPresent: [
            { capture: 'popup', locale: 'en', theme: 'dark', sourcePath: '/abs/en-dark-popup.png' },
          ],
          primaryDestination: 'starlight',
        }),
      ],
      destinationFiles: new Map<DestinationTarget, Set<string>>([
        ['starlight', new Set(['en-dark-popup.png'])],
        ['readme', new Set()],
        ['chrome-web-store', new Set()],
      ]),
      prune: true,
    };
    const plan = planSync(input);
    expect(plan.prunes).toEqual([]);
  });

  it('returns operations sorted deterministically by destination/path', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'b',
          destinations: [
            { target: 'readme', path: 'b', locales: ['en'], themes: ['dark'] },
          ],
        },
        {
          capture: 'a',
          destinations: [
            { target: 'readme', path: 'a', locales: ['en'], themes: ['dark'] },
          ],
        },
      ],
    };
    const input: PlanSyncInput = {
      pipelines: [
        pipeline({
          id: 'demo',
          manifest,
          capturesPresent: [
            { capture: 'a', locale: 'en', theme: 'dark', sourcePath: '/abs/a.png' },
            { capture: 'b', locale: 'en', theme: 'dark', sourcePath: '/abs/b.png' },
          ],
        }),
      ],
      destinationFiles: emptyDestinationFiles(),
    };
    const plan = planSync(input);
    expect(plan.copies.map((c) => c.destinationPath)).toEqual([
      'en-dark-a.png',
      'en-dark-b.png',
    ]);
  });
});

describe('summarizeSync', () => {
  it('aggregates per-destination counters for copies, skips and prunes', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'rules',
          destinations: [
            { target: 'readme', path: 'rules', locales: ['en'], themes: ['dark'] },
            { target: 'chrome-web-store', path: 'rules', locales: ['en'], themes: ['dark'] },
          ],
        },
        {
          capture: 'missing',
          destinations: [
            { target: 'readme', path: 'missing', locales: ['fr'], themes: ['dark'] },
          ],
        },
      ],
    };
    const plan = planSync({
      pipelines: [
        pipeline({
          id: 'demo',
          manifest,
          capturesPresent: [
            { capture: 'rules', locale: 'en', theme: 'dark', sourcePath: '/abs/rules.png' },
          ],
        }),
      ],
      destinationFiles: new Map<DestinationTarget, Set<string>>([
        ['starlight', new Set()],
        ['readme', new Set(['legacy.png'])],
        ['chrome-web-store', new Set()],
      ]),
      prune: true,
    });
    const summary = summarizeSync(plan);
    expect(summary.copied).toBe(2);
    expect(summary.skipped).toBe(1);
    expect(summary.pruned).toBe(1);
    expect(summary.byDestination.map((s) => s.destination)).toEqual([
      'starlight',
      'readme',
      'chrome-web-store',
    ]);
    const readme = summary.byDestination.find((s) => s.destination === 'readme');
    expect(readme).toMatchObject({ copied: 1, skipped: 1, pruned: 1 });
    const cws = summary.byDestination.find((s) => s.destination === 'chrome-web-store');
    expect(cws).toMatchObject({ copied: 1, skipped: 0, pruned: 0 });
  });
});
