export { EXPLORATION_DOMAINS, type ExplorationDomain, domainLabelKey, isExplorationDomain } from './domains.js';
export { EXPLORATION_PHASES, PHASE_TICKS, phaseForCoverage, type ResolvedPhase, type ExplorationPhaseKey } from './phases.js';
export {
  type Prerequisite,
  type MissingPrerequisite,
  isPrerequisiteMet,
  describeMissing,
  prerequisiteLeafIds,
} from './prerequisites.js';
export {
  CATALOG,
  CATALOG_IDS,
  type CatalogEntry,
  type DetectRule,
  entryLabelKey,
  entryDescriptionKey,
} from './catalog.js';
export {
  discoveredSet,
  getEntryState,
  computeCoverage,
  type CoverageSummary,
  type DomainCoverage,
} from './coverage.js';
export { validateCatalog, type CatalogValidationResult } from './validateCatalog.js';
export {
  markDiscovered,
  markValue,
  setManualMark,
  getExplorationProgress,
  initExplorationProgress,
  flushExplorationWrites,
} from './progressStore.js';
