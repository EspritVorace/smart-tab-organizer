/** Adds or removes a value from an array, preserving order, no duplicates. */
export function toggleInArray<T>(arr: readonly T[], item: T, checked: boolean): T[] {
  if (checked) return arr.includes(item) ? [...arr] : [...arr, item];
  return arr.filter(v => v !== item);
}
