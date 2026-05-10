/**
 * `navigator.platform` is deprecated but still implemented everywhere we run
 * (Chrome MV3, Firefox MV2). Reading it once at module load avoids paying the
 * cost on every keystroke and keeps the value trivially mockable from tests
 * via `vi.mock('@/utils/platform', ...)`.
 */
export const IS_MAC: boolean = (() => {
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.platform || '';
  return /^(Mac|iPhone|iPad|iPod)/i.test(platform);
})();
