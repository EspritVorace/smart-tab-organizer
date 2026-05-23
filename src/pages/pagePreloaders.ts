import { logger } from '@/utils/logger.js';

type PagePreloader = () => Promise<unknown>;

export const pagePreloaders: Record<string, PagePreloader> = {
  rules: () => import('./DomainRulesPage'),
  sessions: () => import('./SessionsPage'),
  importexport: () => import('./ImportExportPage'),
  stats: () => import('./StatisticsPage'),
  settings: () => import('@/components/UI/SettingsPage/SettingsPage'),
  workspaces: () => import('./WorkspacesPage'),
};

const triggered = new Set<string>();

export function preloadPage(id: string): void {
  if (triggered.has(id)) return;
  const loader = pagePreloaders[id];
  if (!loader) return;
  triggered.add(id);
  const t0 = performance.now();
  loader().then(
    () => logger.debug(`[PRELOAD] ${id} fetched in ${Math.round(performance.now() - t0)}ms`),
    (err) => {
      triggered.delete(id);
      logger.warn(`[PRELOAD] ${id} failed`, err);
    },
  );
}
