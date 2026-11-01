import { beforeEach, describe, expect, it } from 'vitest'
import { addVocabulary, db, getAllVocabulary } from '@/db/database'
import {
  BACKUP_FORMAT_VERSION,
  BackupError,
  exportBackupJson,
  importBackup,
  parseBackup,
} from '@/lib/backup'
import type { Vocabulary } from '@/types/vocabulary'

const record = (id: string, overrides: Partial<Vocabulary> = {}): Vocabulary => ({
  id,
  date: '2026-10-30',
  dutch: `woord-${id}`,
  chinese: '词',
  exampleDutch: 'Dit is een zin.',
  exampleChinese: '',
  createdAt: '2026-10-30T18:00:00.000Z',
  updatedAt: '2026-10-30T18:00:00.000Z',
  ...overrides,
})

const backupText = (vocabulary: unknown[], extra: object = {}) =>
  JSON.stringify({ app: 'mijn-woordenboek', formatVersion: 1, exportedAt: '', appVersion: '1.0.0', vocabulary, ...extra })

beforeEach(async () => {
  await db.vocabulary.clear()
})

describe('backup', () => {
  it('exports all words with a format version and round-trips them', async () => {
    await addVocabulary({ date: '2026-10-30', dutch: 'gezellig', chinese: '温馨', exampleDutch: 'Zo gezellig!', exampleChinese: '' })
    const json = await exportBackupJson('1.0.0')
    const parsed = JSON.parse(json)
    expect(parsed.app).toBe('mijn-woordenboek')
    expect(parsed.formatVersion).toBe(BACKUP_FORMAT_VERSION)
    expect(parsed.vocabulary).toHaveLength(1)

    const before = await getAllVocabulary()
    await db.vocabulary.clear()
    const result = await importBackup(parseBackup(json), 'merge')
    expect(result).toEqual({ imported: 1, skipped: 0, invalid: 0 })
    expect(await getAllVocabulary()).toEqual(before)
  })

  it('rejects files that are not backups', () => {
    expect(() => parseBackup('not json')).toThrow(BackupError)
    expect(() => parseBackup('[]')).toThrow(BackupError)
    expect(() => parseBackup('{"vocabulary": []}')).toThrow(BackupError)
    expect(() => parseBackup(backupText([], { formatVersion: 99 }))).toThrow(/newer version/)
  })

  it('counts invalid and duplicate records', () => {
    const parsed = parseBackup(
      backupText([
        record('a'),
        record('a'), // duplicate id within the file
        record('b', { date: '2026-02-30' }),
        record('c', { dutch: '  ' }),
        { nonsense: true },
        record('d', { createdAt: 'garbage' } as Partial<Vocabulary>),
      ]),
    )
    expect(parsed.records.map((r) => r.id)).toEqual(['a', 'd'])
    expect(parsed.invalid).toBe(4)
    // An invalid timestamp is repaired rather than rejected.
    expect(Number.isNaN(Date.parse(parsed.records[1].createdAt))).toBe(false)
  })

  it('merge skips records whose id already exists', async () => {
    await db.vocabulary.add(record('a', { dutch: 'mine' }))
    const result = await importBackup(parseBackup(backupText([record('a'), record('b')])), 'merge')
    expect(result).toEqual({ imported: 1, skipped: 1, invalid: 0 })
    const all = await getAllVocabulary()
    expect(all).toHaveLength(2)
    expect(all.find((r) => r.id === 'a')?.dutch).toBe('mine')
  })

  it('importing the same backup twice does not duplicate words', async () => {
    const parsed = parseBackup(backupText([record('a'), record('b')]))
    await importBackup(parsed, 'merge')
    const second = await importBackup(parsed, 'merge')
    expect(second).toEqual({ imported: 0, skipped: 2, invalid: 0 })
    expect(await db.vocabulary.count()).toBe(2)
  })

  it('replace removes existing words', async () => {
    await db.vocabulary.add(record('old'))
    const result = await importBackup(parseBackup(backupText([record('new')])), 'replace')
    expect(result.imported).toBe(1)
    expect((await getAllVocabulary()).map((r) => r.id)).toEqual(['new'])
  })
})
