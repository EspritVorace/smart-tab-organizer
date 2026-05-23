import { useMemo } from 'react';
import type { Session } from '@/types/session';
import type { ChromeGroupColor } from '@/types/tabTree';
import { usePinnedSessions } from './usePinnedSessions';
import { useActiveSessions } from './useActiveSessions';
import { useArchivedSessions } from './useArchivedSessions';
import { countSessionTabs } from '@/utils/sessionUtils';
import { computeDateWindows, type DateWindows } from '@/utils/statisticsDateUtils';

export interface SessionStatisticsVolumes {
  total: number;
  pinned: number;
  active: number;
  archived: number;
  totalTabs: number;
  totalGroups: number;
  averageTabsPerSession: number;
  largest: { name: string; tabCount: number } | null;
  percentWithNote: number;
  percentWithCategory: number;
}

export interface TopCategoryStat {
  id: string;
  count: number;
}

export interface TopDomainStat {
  host: string;
  count: number;
}

export interface TopSessionStat {
  id: string;
  name: string;
  tabCount: number;
}

export interface GroupColorStat {
  color: ChromeGroupColor;
  count: number;
}

export interface SessionStatisticsComposition {
  topCategories: TopCategoryStat[];
  topDomains: TopDomainStat[];
  groupColorDistribution: GroupColorStat[];
  topSessionsByTabs: TopSessionStat[];
}

export interface SessionStatisticsTemporal {
  oldest: { id: string; name: string; createdAt: string } | null;
  mostRecentlyUpdated: { id: string; name: string; updatedAt: string } | null;
  createdThisWeek: number;
  createdLastWeek: number;
  updatedThisWeek: number;
}

export interface SessionStatisticsSnapshot {
  volumes: SessionStatisticsVolumes;
  composition: SessionStatisticsComposition;
  temporal: SessionStatisticsTemporal;
  isLoaded: boolean;
}

const CHROME_GROUP_COLORS: ChromeGroupColor[] = [
  'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange',
];

function extractHost(url: string): string | null {
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

interface VolumeAccumulator {
  totalTabs: number;
  totalGroups: number;
  withNote: number;
  withCategory: number;
  largest: { name: string; tabCount: number } | null;
}

function accumulateVolume(acc: VolumeAccumulator, session: Session): void {
  const tabCount = countSessionTabs(session);
  acc.totalTabs += tabCount;
  acc.totalGroups += session.groups.length;
  if (session.note && session.note.trim().length > 0) acc.withNote++;
  if (session.categoryId) acc.withCategory++;
  if (!acc.largest || tabCount > acc.largest.tabCount) {
    acc.largest = { name: session.name, tabCount };
  }
}

function computeVolumes(
  pinned: Session[],
  active: Session[],
  archivedCount: number,
): SessionStatisticsVolumes {
  const heavy = [...pinned, ...active];
  const acc: VolumeAccumulator = {
    totalTabs: 0,
    totalGroups: 0,
    withNote: 0,
    withCategory: 0,
    largest: null,
  };

  for (const session of heavy) accumulateVolume(acc, session);

  const heavyCount = heavy.length;
  const averageTabsPerSession = heavyCount > 0 ? acc.totalTabs / heavyCount : 0;
  const percentWithNote = heavyCount > 0 ? (acc.withNote / heavyCount) * 100 : 0;
  const percentWithCategory = heavyCount > 0 ? (acc.withCategory / heavyCount) * 100 : 0;

  return {
    total: heavyCount + archivedCount,
    pinned: pinned.length,
    active: active.length,
    archived: archivedCount,
    totalTabs: acc.totalTabs,
    totalGroups: acc.totalGroups,
    averageTabsPerSession,
    largest: acc.largest,
    percentWithNote,
    percentWithCategory,
  };
}

interface CompositionAccumulator {
  categoryCounts: Map<string, number>;
  domainCounts: Map<string, number>;
  colorCounts: Map<ChromeGroupColor, number>;
  sessionsByTabs: TopSessionStat[];
}

function addDomain(counts: Map<string, number>, url: string): void {
  const host = extractHost(url);
  if (host) counts.set(host, (counts.get(host) ?? 0) + 1);
}

function accumulateComposition(acc: CompositionAccumulator, session: Session): void {
  if (session.categoryId) {
    acc.categoryCounts.set(
      session.categoryId,
      (acc.categoryCounts.get(session.categoryId) ?? 0) + 1,
    );
  }

  for (const tab of session.ungroupedTabs) addDomain(acc.domainCounts, tab.url);
  for (const group of session.groups) {
    acc.colorCounts.set(group.color, (acc.colorCounts.get(group.color) ?? 0) + 1);
    for (const tab of group.tabs) addDomain(acc.domainCounts, tab.url);
  }

  acc.sessionsByTabs.push({
    id: session.id,
    name: session.name,
    tabCount: countSessionTabs(session),
  });
}

function computeComposition(
  pinned: Session[],
  active: Session[],
): SessionStatisticsComposition {
  const heavy = [...pinned, ...active];
  const acc: CompositionAccumulator = {
    categoryCounts: new Map(),
    domainCounts: new Map(),
    colorCounts: new Map(),
    sessionsByTabs: [],
  };

  for (const session of heavy) accumulateComposition(acc, session);

  const topCategories = Array.from(acc.categoryCounts.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topDomains = Array.from(acc.domainCounts.entries())
    .map(([host, count]) => ({ host, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const groupColorDistribution = CHROME_GROUP_COLORS
    .map(color => ({ color, count: acc.colorCounts.get(color) ?? 0 }))
    .filter(entry => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const topSessionsByTabs = acc.sessionsByTabs
    .filter(s => s.tabCount > 0)
    .sort((a, b) => b.tabCount - a.tabCount)
    .slice(0, 5);

  return { topCategories, topDomains, groupColorDistribution, topSessionsByTabs };
}

interface TemporalAccumulator {
  oldest: Session | null;
  mostRecent: Session | null;
  createdThisWeek: number;
  createdLastWeek: number;
  updatedThisWeek: number;
}

function accumulateTemporal(
  acc: TemporalAccumulator,
  windows: DateWindows,
  session: Session,
): void {
  if (!acc.oldest || session.createdAt < acc.oldest.createdAt) acc.oldest = session;
  if (!acc.mostRecent || session.updatedAt > acc.mostRecent.updatedAt) acc.mostRecent = session;

  const createdAt = new Date(session.createdAt);
  if (!Number.isNaN(createdAt.getTime())) {
    if (createdAt >= windows.thisWeekStart) acc.createdThisWeek++;
    else if (createdAt >= windows.lastWeekStart && createdAt <= windows.lastWeekEnd) {
      acc.createdLastWeek++;
    }
  }

  const updatedAt = new Date(session.updatedAt);
  if (!Number.isNaN(updatedAt.getTime()) && updatedAt >= windows.thisWeekStart) {
    acc.updatedThisWeek++;
  }
}

function computeTemporal(allSessions: Session[]): SessionStatisticsTemporal {
  if (allSessions.length === 0) {
    return {
      oldest: null,
      mostRecentlyUpdated: null,
      createdThisWeek: 0,
      createdLastWeek: 0,
      updatedThisWeek: 0,
    };
  }

  const windows = computeDateWindows(new Date());
  const acc: TemporalAccumulator = {
    oldest: null,
    mostRecent: null,
    createdThisWeek: 0,
    createdLastWeek: 0,
    updatedThisWeek: 0,
  };

  for (const session of allSessions) accumulateTemporal(acc, windows, session);

  return {
    oldest: acc.oldest
      ? { id: acc.oldest.id, name: acc.oldest.name, createdAt: acc.oldest.createdAt }
      : null,
    mostRecentlyUpdated: acc.mostRecent
      ? { id: acc.mostRecent.id, name: acc.mostRecent.name, updatedAt: acc.mostRecent.updatedAt }
      : null,
    createdThisWeek: acc.createdThisWeek,
    createdLastWeek: acc.createdLastWeek,
    updatedThisWeek: acc.updatedThisWeek,
  };
}

export interface UseSessionStatisticsReturn {
  snapshot: SessionStatisticsSnapshot;
}

/**
 * Computes session statistics from the three session buckets. Heavy
 * computations (tab iteration, URL parsing) are restricted to active +
 * pinned sessions; archived sessions only contribute their count and
 * top-level timestamps to keep large archives from degrading perf.
 */
export function useSessionStatistics(): UseSessionStatisticsReturn {
  const pinned = usePinnedSessions();
  const active = useActiveSessions();
  const archived = useArchivedSessions({ enabled: true });

  const isLoaded = pinned.isLoaded && active.isLoaded && archived.isLoaded;

  const snapshot = useMemo<SessionStatisticsSnapshot>(() => {
    const allSessions = [
      ...pinned.pinnedSessions,
      ...active.activeSessions,
      ...archived.archivedSessions,
    ];

    return {
      volumes: computeVolumes(
        pinned.pinnedSessions,
        active.activeSessions,
        archived.archivedSessions.length,
      ),
      composition: computeComposition(pinned.pinnedSessions, active.activeSessions),
      temporal: computeTemporal(allSessions),
      isLoaded,
    };
  }, [pinned.pinnedSessions, active.activeSessions, archived.archivedSessions, isLoaded]);

  return { snapshot };
}
