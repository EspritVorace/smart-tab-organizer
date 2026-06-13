/**
 * Journey phases derived from the flat global coverage ratio. Phases name a
 * state of the journey, never the person: no "novice"/"beginner" wording. The
 * current phase is the first whose `max` bound the ratio has not yet reached.
 */
export const EXPLORATION_PHASES = [
  { key: 'discovery', labelKey: 'explorationPhaseDiscovery', min: 0, max: 0.25 },
  { key: 'gettingStarted', labelKey: 'explorationPhaseGettingStarted', min: 0.25, max: 0.6 },
  { key: 'proficiency', labelKey: 'explorationPhaseProficiency', min: 0.6, max: 0.85 },
  { key: 'expertise', labelKey: 'explorationPhaseExpertise', min: 0.85, max: 1.01 },
] as const;

export type ExplorationPhaseKey = (typeof EXPLORATION_PHASES)[number]['key'];

export interface ResolvedPhase {
  key: ExplorationPhaseKey;
  labelKey: string;
  index: number;
}

/**
 * Returns the current phase for a coverage ratio in [0, 1]. Ratios are clamped
 * defensively; the last phase covers the 85-100% band inclusively.
 */
export function phaseForCoverage(ratio: number): ResolvedPhase {
  const clamped = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0;
  for (let i = 0; i < EXPLORATION_PHASES.length; i++) {
    if (clamped < EXPLORATION_PHASES[i].max) {
      return { key: EXPLORATION_PHASES[i].key, labelKey: EXPLORATION_PHASES[i].labelKey, index: i };
    }
  }
  const last = EXPLORATION_PHASES[EXPLORATION_PHASES.length - 1];
  return { key: last.key, labelKey: last.labelKey, index: EXPLORATION_PHASES.length - 1 };
}

/** Phase-boundary ratios used to draw ticks under the global progress bar. */
export const PHASE_TICKS: number[] = EXPLORATION_PHASES.slice(1).map((p) => p.min);
