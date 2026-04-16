/**
 * Shared mock data for Storybook stories and portable-story tests.
 */
import type { Session } from '../../src/types/session';
import type { SyncSettings, DomainRuleSetting } from '../../src/types/syncSettings';

export const mockTab = (id: string, title: string, url: string) => ({
  id,
  title,
  url,
  favIconUrl: '',
});

export const mockSession: Session = {
  id: 'session-1',
  name: 'Work Sprint 42',
  createdAt: '2025-03-20T09:00:00.000Z',
  updatedAt: '2025-03-28T17:30:00.000Z',
  isPinned: false,
  categoryId: null,
  groups: [
    {
      id: 'grp-frontend',
      title: 'Frontend',
      color: 'blue',
      tabs: [
        mockTab('t1', 'React Docs', 'https://react.dev/reference/react/useEffect'),
        mockTab('t2', 'GitHub PR #42', 'https://github.com/my-org/my-repo/pull/42'),
      ],
    },
    {
      id: 'grp-backend',
      title: 'Backend APIs',
      color: 'green',
      tabs: [
        mockTab('t3', 'FastAPI Docs', 'https://fastapi.tiangolo.com/'),
        mockTab('t4', 'PostgreSQL JSON', 'https://www.postgresql.org/docs/current/functions-json.html'),
      ],
    },
  ],
  ungroupedTabs: [
    mockTab('t5', 'Figma Designs', 'https://figma.com/file/abc123'),
  ],
};

export const mockPinnedSession: Session = {
  ...mockSession,
  id: 'session-pinned',
  name: 'Pinned Profile',
  isPinned: true,
};

export const mockRule: DomainRuleSetting = {
  id: 'rule-1',
  domainFilter: 'github.com',
  label: 'GitHub',
  titleParsingRegEx: '(.+)',
  urlParsingRegEx: '',
  groupNameSource: 'title',
  deduplicationMatchMode: 'exact',
  color: 'purple',
  deduplicationEnabled: true,
  presetId: null,
  enabled: true,
};

export const mockSyncSettings: SyncSettings = {
  globalGroupingEnabled: true,
  globalDeduplicationEnabled: true,
  deduplicateUnmatchedDomains: true,
  notifyOnGrouping: true,
  notifyOnDeduplication: true,
  domainRules: [mockRule],
};

export const noop = () => {};
export const asyncNoop = async () => {};
