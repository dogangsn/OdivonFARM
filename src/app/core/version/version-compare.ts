/** Compares the x.y.z part of two versions; anything after `+` or `-` is ignored. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split(/[+-]/)[0].split('.').map((n) => Number.parseInt(n, 10) || 0);
  const [left, right] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
}

/**
 * Storage keys that survive an update: display preferences and the offline queue
 * (records captured offline that have not reached the API yet must not be lost).
 */
export const PRESERVED_STORAGE_KEYS = ['odivon_language', 'odivon_sidebar_collapsed', 'odivon_offline_queue'];
