/**
 * Project logger — mirrors WXT's internal logger pattern.
 * All methods are no-ops in production builds (`import.meta.env.MODE === "production"`).
 */
function print(method: (...args: unknown[]) => void, ...args: unknown[]): void {
  if (import.meta.env.MODE === 'production') return;
  method('[smart-tab-organizer]', ...args);
}

export const logger = {
  debug: (...args: unknown[]) => print(console.debug, ...args),
  log: (...args: unknown[]) => print(console.log, ...args),
  warn: (...args: unknown[]) => print(console.warn, ...args),
  error: (...args: unknown[]) => print(console.error, ...args),
};
