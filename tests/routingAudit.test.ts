import { describe, it, expect } from 'vitest';
import {
  formatAuditMarkdown,
  resolveDestinationPath,
  runAudit,
  type AuditInput,
  type Pipeline,
} from '../e2e-shared/routing/audit.js';
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

function pipeline(overrides: Partial<Pipeline> & { id: string; manifest: Manifest }): Pipeline {
  return {
    capturesPresent: [],
    locales: [...ALL_LOCALES],
    themes: [...ALL_THEMES],
    ...overrides,
  };
}

describe('resolveDestinationPath', () => {
  it('appends locale-theme prefix when no template placeholder is used', () => {
    expect(resolveDestinationPath('rules-list', 'en', 'dark')).toBe('en-dark-rules-list.png');
  });

  it('substitutes {locale} and {theme} placeholders', () => {
    expect(resolveDestinationPath('features/{locale}/{theme}/rules', 'fr', 'light')).toBe(
      'features/fr/light/rules.png',
    );
  });

  it('keeps an explicit .png suffix as is', () => {
    expect(resolveDestinationPath('rules.png', 'en', 'dark')).toBe('en-dark-rules.png');
  });
});

describe('runAudit', () => {
  it('returns an empty report when manifests, captures and destinations are empty', () => {
    const input: AuditInput = {
      pipelines: [],
      destinationFiles: emptyDestinationFiles(),
    };
    const report = runAudit(input);
    expect(report.hasErrors).toBe(false);
    expect(report.obsoleteReferences).toEqual([]);
    expect(report.orphanCaptures).toEqual([]);
    expect(report.orphanDestinationFiles).toEqual([]);
    expect(report.missingDestinationFiles).toEqual([]);
    expect(report.destinationSummaries.map((s) => s.destination)).toEqual([
      'starlight',
      'readme',
      'chrome-web-store',
    ]);
    for (const summary of report.destinationSummaries) {
      expect(summary).toMatchObject({ expected: 0, present: 0, missing: 0, orphan: 0 });
    }
  });

  it('flags an obsolete reference when a manifest cites a missing capture', () => {
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
    const input: AuditInput = {
      pipelines: [pipeline({ id: 'demo', manifest })],
      destinationFiles: emptyDestinationFiles(),
    };
    const report = runAudit(input);
    expect(report.hasErrors).toBe(true);
    expect(report.obsoleteReferences).toHaveLength(1);
    expect(report.obsoleteReferences[0]).toMatchObject({
      pipeline: 'demo',
      capture: 'rules-list',
      locale: 'en',
      theme: 'dark',
      destination: 'readme',
      destinationPath: 'en-dark-rules-list.png',
    });
  });

  it('flags an orphan capture when no manifest references it', () => {
    const manifest: Manifest = { routes: [] };
    const input: AuditInput = {
      pipelines: [
        pipeline({
          id: 'scenario-x',
          manifest,
          capturesPresent: [{ capture: 'leftover', locale: 'fr', theme: 'dark' }],
        }),
      ],
      destinationFiles: emptyDestinationFiles(),
    };
    const report = runAudit(input);
    expect(report.hasErrors).toBe(false);
    expect(report.orphanCaptures).toHaveLength(1);
    expect(report.orphanCaptures[0]).toMatchObject({
      pipeline: 'scenario-x',
      capture: 'leftover',
      locale: 'fr',
      theme: 'dark',
    });
  });

  it('does not flag captures as orphan when the pipeline writes them to a primary destination', () => {
    const manifest: Manifest = { routes: [] };
    const input: AuditInput = {
      pipelines: [
        pipeline({
          id: 'screenshots',
          manifest,
          capturesPresent: [{ capture: 'popup', locale: 'en', theme: 'dark' }],
          primaryDestination: 'starlight',
        }),
      ],
      destinationFiles: new Map<DestinationTarget, Set<string>>([
        ['starlight', new Set(['en-dark-popup.png'])],
        ['readme', new Set()],
        ['chrome-web-store', new Set()],
      ]),
    };
    const report = runAudit(input);
    expect(report.orphanCaptures).toEqual([]);
    expect(report.missingDestinationFiles).toEqual([]);
    expect(report.orphanDestinationFiles).toEqual([]);
    const starlight = report.destinationSummaries.find((s) => s.destination === 'starlight');
    expect(starlight).toMatchObject({ expected: 1, present: 1, missing: 0, orphan: 0 });
  });

  it('reports missing and orphan files per destination, plus a summary', () => {
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
    const input: AuditInput = {
      pipelines: [
        pipeline({
          id: 'demo',
          manifest,
          capturesPresent: [{ capture: 'rules-list', locale: 'en', theme: 'dark' }],
        }),
      ],
      destinationFiles: new Map<DestinationTarget, Set<string>>([
        ['starlight', new Set()],
        ['readme', new Set(['legacy.png'])],
        ['chrome-web-store', new Set()],
      ]),
    };
    const report = runAudit(input);
    expect(report.hasErrors).toBe(false);
    expect(report.missingDestinationFiles).toHaveLength(1);
    expect(report.missingDestinationFiles[0]).toMatchObject({
      destination: 'readme',
      relativePath: 'en-dark-rules-list.png',
    });
    expect(report.orphanDestinationFiles).toHaveLength(1);
    expect(report.orphanDestinationFiles[0]).toMatchObject({
      destination: 'readme',
      relativePath: 'legacy.png',
    });
    const readmeSummary = report.destinationSummaries.find((s) => s.destination === 'readme');
    expect(readmeSummary).toMatchObject({ expected: 1, present: 1, missing: 1, orphan: 1 });
  });

  it('expands route destinations across pipeline locales and themes when filters are omitted', () => {
    const manifest: Manifest = {
      routes: [
        {
          capture: 'rules-list',
          destinations: [{ target: 'starlight', path: 'rules-list' }],
        },
      ],
    };
    const presentCombos = ALL_LOCALES.flatMap((locale) =>
      ALL_THEMES.map((theme) => ({ capture: 'rules-list', locale, theme })),
    );
    const input: AuditInput = {
      pipelines: [pipeline({ id: 'demo', manifest, capturesPresent: presentCombos })],
      destinationFiles: emptyDestinationFiles(),
    };
    const report = runAudit(input);
    expect(report.obsoleteReferences).toEqual([]);
    const starlight = report.destinationSummaries.find((s) => s.destination === 'starlight');
    expect(starlight?.expected).toBe(ALL_LOCALES.length * ALL_THEMES.length);
  });
});

describe('formatAuditMarkdown', () => {
  it('produces a deterministic markdown report when given a fixed timestamp', () => {
    const report = runAudit({
      pipelines: [],
      destinationFiles: emptyDestinationFiles(),
    });
    const md = formatAuditMarkdown(report, { generatedAt: '2026-05-08T00:00:00Z' });
    expect(md).toContain('# Routing audit report');
    expect(md).toContain('Generated: 2026-05-08T00:00:00Z');
    expect(md).toContain('## Summary by destination');
    expect(md).toContain('## Obsolete references');
    expect(md).toContain('## Orphan captures');
    expect(md).toContain('## Orphan destination files');
    expect(md).toContain('## Missing destination files');
  });

  it('renders an obsolete reference row in the table', () => {
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
    const report = runAudit({
      pipelines: [pipeline({ id: 'demo', manifest })],
      destinationFiles: emptyDestinationFiles(),
    });
    const md = formatAuditMarkdown(report, { generatedAt: 'fixed' });
    expect(md).toContain('| `demo` | `rules-list` | en | dark | `readme` | `en-dark-rules-list.png` |');
  });
});
