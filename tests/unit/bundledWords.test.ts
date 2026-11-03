import { beforeEach, describe, expect, it } from 'vitest'
import { db, getAllVocabulary, updateVocabulary } from '@/db/database'
import { parseWordFiles, syncBundledWords } from '@/lib/bundledWords'

const gezellig = { dutch: 'gezellig', chinese: '温馨的', exampleDutch: 'Het is gezellig.' }
const fiets = { dutch: 'de fiets', chinese: '自行车', exampleDutch: 'Ik fiets.', exampleChinese: '我骑车。' }

beforeEach(async () => {
  await db.vocabulary.clear()
  await db.bundled.clear()
})

describe('parseWordFiles', () => {
  it('takes the date from the file name and validates words', () => {
    const { words, errors } = parseWordFiles({
      '../words/2026/10/2026-10-30.json': [gezellig, fiets, { dutch: 'leeg' }, { ...gezellig }],
      '../words/2026/10/notes.json': [gezellig],
      '../words/2026/10/2026-10-31.json': { dutch: 'x' },
      '../words/2026/11/2026-10-29.json': [gezellig],
    }, new Set())
    expect(words.map((w) => [w.date, w.dutch])).toEqual([
      ['2026-10-30', 'gezellig'],
      ['2026-10-30', 'de fiets'],
    ])
    expect(words[0].exampleChinese).toBe('')
    expect(errors).toHaveLength(5)
    expect(errors.join('\n')).toMatch(/should be in the folder 2026\/10\//)
    expect(errors.join('\n')).toMatch(/2026-10-30.json word 3/)
    expect(errors.join('\n')).toMatch(/appears twice/)
  })
})

describe('syncBundledWords', () => {
  const parse = (list: unknown[]) => parseWordFiles({ '../words/2026/10/2026-10-30.json': list }, new Set(['kat.svg'])).words

  it('adds new words once, in file order', async () => {
    expect(await syncBundledWords(parse([gezellig, fiets]))).toEqual({ added: 2, updated: 0, removed: 0 })
    expect(await syncBundledWords(parse([gezellig, fiets]))).toEqual({ added: 0, updated: 0, removed: 0 })
    expect((await getAllVocabulary()).map((w) => w.dutch)).toEqual(['gezellig', 'de fiets'])
  })

  it('updates words changed in the file and removes words deleted from the file', async () => {
    await syncBundledWords(parse([gezellig, fiets]))
    const result = await syncBundledWords(parse([{ ...gezellig, chinese: '舒适的' }]))
    expect(result).toEqual({ added: 0, updated: 1, removed: 1 })
    const all = await getAllVocabulary()
    expect(all.map((w) => [w.dutch, w.chinese])).toEqual([['gezellig', '舒适的']])
  })

  it('keeps edits made in the app while the file is unchanged, and leaves app-added words alone', async () => {
    await syncBundledWords(parse([gezellig]))
    const [word] = await getAllVocabulary()
    await updateVocabulary(word.id, { ...word, chinese: 'my own' })
    await db.vocabulary.add({ ...word, id: 'app-word', dutch: 'eigen' })

    await syncBundledWords(parse([gezellig]))
    const all = await getAllVocabulary()
    expect(all.find((w) => w.id === word.id)?.chinese).toBe('my own')
    expect(all.some((w) => w.id === 'app-word')).toBe(true)
  })

  it('allows a picture instead of an example, and checks the picture exists', () => {
    const { words, errors } = parseWordFiles(
      {
        '../words/2026/11/2026-11-03.json': [
          { dutch: 'de kat', chinese: '猫', image: 'kat.svg' },
          { dutch: 'de hond', chinese: '狗', image: 'hond.svg' },
          { dutch: 'de bal', chinese: '球' },
        ],
      },
      new Set(['kat.svg']),
    )
    expect(words).toEqual([expect.objectContaining({ dutch: 'de kat', image: 'kat.svg', exampleDutch: '' })])
    expect(errors).toEqual([
      expect.stringMatching(/word 2: picture "hond.svg" not found/),
      expect.stringMatching(/word 3: .*or add a picture/),
    ])
  })

  it('adds and removes pictures when the file changes', async () => {
    await syncBundledWords(parse([{ ...gezellig, image: 'kat.svg' }]))
    expect((await getAllVocabulary())[0].image).toBe('kat.svg')
    await syncBundledWords(parse([gezellig]))
    expect((await getAllVocabulary())[0]).not.toHaveProperty('image')
  })
})
