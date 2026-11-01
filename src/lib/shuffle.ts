/** FNV-1a string hash → unsigned 32-bit integer. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Deterministically shuffles items by seed. The same seed always gives the same
 * order, so the order stays stable while the underlying list re-renders.
 */
export function seededShuffle<T extends { id: string }>(items: readonly T[], seed: number): T[] {
  return [...items]
    .map((item) => ({ item, key: hash(`${seed}:${item.id}`) }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item)
}
