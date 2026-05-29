import { lazy, type ComponentType } from 'react';
import { logger } from './logger.js';

// Mirrors React's own `lazy` signature, which uses `any` to allow any
// component shape to flow through unchanged.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

export function lazyWithTiming<T extends AnyComponent>(
  name: string,
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() => {
    const t0 = performance.now();
    return factory().then((mod) => {
      const ms = Math.round(performance.now() - t0);
      logger.debug(`[LAZY] ${name} loaded in ${ms}ms`);
      return mod;
    });
  });
}
