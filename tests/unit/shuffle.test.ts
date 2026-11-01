import { describe, expect, it } from 'vitest'
import { seededShuffle } from '@/lib/shuffle'

describe('seededShuffle', () => {
  const items = Array.from({ length: 20 }, (_, i) => ({ id: `id-${i}` }))

  it('is deterministic for a seed and keeps every item', () => {
    const a = seededShuffle(items, 42)
    expect(seededShuffle(items, 42)).toEqual(a)
    expect([...a].sort((x, y) => x.id.localeCompare(y.id))).toEqual([...items].sort((x, y) => x.id.localeCompare(y.id)))
  })

  it('changes order for different seeds', () => {
    expect(seededShuffle(items, 1)).not.toEqual(seededShuffle(items, 2))
  })
})
