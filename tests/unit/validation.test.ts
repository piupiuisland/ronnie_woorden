import { describe, expect, it } from 'vitest'
import { validateVocabularyInput } from '@/lib/validation'

describe('validateVocabularyInput', () => {
  it('trims and collapses whitespace', () => {
    const result = validateVocabularyInput({
      dutch: '  gezellig ',
      chinese: ' 温馨的 ',
      exampleDutch: 'Het is   gezellig\n bij ons thuis. ',
      exampleChinese: '   ',
      date: '2026-10-30',
    })
    expect(result).toEqual({
      ok: true,
      value: {
        dutch: 'gezellig',
        chinese: '温馨的',
        exampleDutch: 'Het is gezellig bij ons thuis.',
        exampleChinese: '',
        date: '2026-10-30',
      },
    })
  })

  it('reports missing required fields and invalid dates', () => {
    const result = validateVocabularyInput({ dutch: '   ', chinese: '', exampleDutch: '', date: '2026-02-30' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['chinese', 'date', 'dutch', 'exampleDutch'])
    }
  })

  it('treats the Chinese example as optional', () => {
    const result = validateVocabularyInput({ dutch: 'fiets', chinese: '自行车', exampleDutch: 'Ik fiets.', date: '2026-10-30' })
    expect(result.ok).toBe(true)
  })
})
