import { beforeEach, describe, expect, it } from 'vitest'
import {
  addVocabulary,
  db,
  deleteVocabulary,
  getAllVocabulary,
  getDatesWithWords,
  getWordsForDate,
  updateVocabulary,
  WoordenboekDB,
} from '@/db/database'
import type { VocabularyInput } from '@/types/vocabulary'

const word = (overrides: Partial<VocabularyInput> = {}): VocabularyInput => ({
  date: '2026-10-30',
  dutch: 'gezellig',
  chinese: '温馨的',
  exampleDutch: 'Het is gezellig bij ons thuis.',
  exampleChinese: '我们家里很温馨。',
  ...overrides,
})

beforeEach(async () => {
  await db.vocabulary.clear()
})

describe('database', () => {
  it('adds and reads words by date', async () => {
    const a = await addVocabulary(word())
    await addVocabulary(word({ dutch: 'fiets', date: '2026-10-29' }))
    expect(a.id).toBeTruthy()
    expect(a.createdAt).toBe(a.updatedAt)

    const today = await getWordsForDate('2026-10-30')
    expect(today.map((w) => w.dutch)).toEqual(['gezellig'])
    expect(await getDatesWithWords()).toEqual(['2026-10-29', '2026-10-30'])
  })

  it('allows the same word on different dates and has no daily limit', async () => {
    for (let i = 0; i < 10; i++) await addVocabulary(word({ dutch: `woord${i}` }))
    await addVocabulary(word({ date: '2026-11-01' }))
    expect(await getWordsForDate('2026-10-30')).toHaveLength(10)
    expect(await getWordsForDate('2026-11-01')).toHaveLength(1)
  })

  it('updates a word but preserves its creation time', async () => {
    const original = await addVocabulary(word())
    await new Promise((r) => setTimeout(r, 5))
    await updateVocabulary(original.id, word({ dutch: 'knus', date: '2026-10-31' }))
    const [updated] = await getAllVocabulary()
    expect(updated.dutch).toBe('knus')
    expect(updated.date).toBe('2026-10-31')
    expect(updated.createdAt).toBe(original.createdAt)
    expect(updated.updatedAt > original.updatedAt).toBe(true)
  })

  it('rejects updating a missing word', async () => {
    await expect(updateVocabulary('missing', word())).rejects.toThrow()
  })

  it('deletes a word', async () => {
    const item = await addVocabulary(word())
    await deleteVocabulary(item.id)
    expect(await getAllVocabulary()).toEqual([])
  })

  it('persists across database connections (simulated reload)', async () => {
    const name = 'persistence-test'
    const first = new WoordenboekDB(name)
    await addVocabulary(word(), first)
    first.close()

    const second = new WoordenboekDB(name)
    const words = await getAllVocabulary(second)
    expect(words.map((w) => w.dutch)).toEqual(['gezellig'])
    await second.delete()
  })
})
