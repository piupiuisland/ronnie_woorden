import type { Vocabulary } from '@/types/vocabulary'
import { db, getAllVocabulary, type WoordenboekDB } from '@/db/database'
import { isValidDateKey } from './dates'
import { cleanText } from './validation'

export const BACKUP_APP_ID = 'mijn-woordenboek'
export const BACKUP_FORMAT_VERSION = 1

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  formatVersion: number
  exportedAt: string
  appVersion: string
  vocabulary: Vocabulary[]
}

export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  imported: number
  /** Records skipped because a word with the same id already exists. */
  skipped: number
  /** Records that failed validation. */
  invalid: number
}

export class BackupError extends Error {}

export function createBackup(vocabulary: Vocabulary[], appVersion: string, now = new Date()): BackupFile {
  return {
    app: BACKUP_APP_ID,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    appVersion,
    vocabulary,
  }
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && !Number.isNaN(Date.parse(value))
}

/** Validates and normalises one record, or returns null if it is unusable. */
export function parseVocabularyRecord(raw: unknown): Vocabulary | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id.trim()) return null
  if (!isValidDateKey(r.date)) return null

  const dutch = cleanText(r.dutch)
  const chinese = cleanText(r.chinese)
  const exampleDutch = cleanText(r.exampleDutch)
  if (!dutch || !chinese || !exampleDutch) return null

  const createdAt = isIsoTimestamp(r.createdAt) ? r.createdAt : new Date().toISOString()
  const updatedAt = isIsoTimestamp(r.updatedAt) ? r.updatedAt : createdAt

  return {
    id: r.id.trim(),
    date: r.date,
    dutch,
    chinese,
    exampleDutch,
    exampleChinese: cleanText(r.exampleChinese),
    createdAt,
    updatedAt,
  }
}

export interface ParsedBackup {
  records: Vocabulary[]
  invalid: number
}

/** Parses the text of a backup file. Throws BackupError if the file itself is not a valid backup. */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('This file is not valid JSON.')
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new BackupError('This file is not a Mijn Woordenboek backup.')
  }
  const file = data as Record<string, unknown>
  if (file.app !== BACKUP_APP_ID || !Array.isArray(file.vocabulary)) {
    throw new BackupError('This file is not a Mijn Woordenboek backup.')
  }
  if (typeof file.formatVersion !== 'number' || file.formatVersion > BACKUP_FORMAT_VERSION) {
    throw new BackupError('This backup was made by a newer version of the app. Please update the app first.')
  }

  const records: Vocabulary[] = []
  const seen = new Set<string>()
  let invalid = 0
  for (const raw of file.vocabulary) {
    const record = parseVocabularyRecord(raw)
    if (!record || seen.has(record.id)) {
      invalid++
      continue
    }
    seen.add(record.id)
    records.push(record)
  }
  return { records, invalid }
}

/**
 * Writes parsed records to the database.
 * - merge: keeps existing words; records whose id already exists are skipped.
 * - replace: deletes all existing words first.
 * Runs in a single transaction, so a failure leaves the database untouched.
 */
export async function importBackup(
  parsed: ParsedBackup,
  mode: ImportMode,
  database: WoordenboekDB = db,
): Promise<ImportResult> {
  return database.transaction('rw', database.vocabulary, async () => {
    if (mode === 'replace') {
      await database.vocabulary.clear()
      await database.vocabulary.bulkAdd(parsed.records)
      return { imported: parsed.records.length, skipped: 0, invalid: parsed.invalid }
    }
    const existing = new Set(
      (await database.vocabulary.bulkGet(parsed.records.map((r) => r.id)))
        .filter((r): r is Vocabulary => r !== undefined)
        .map((r) => r.id),
    )
    const fresh = parsed.records.filter((r) => !existing.has(r.id))
    await database.vocabulary.bulkAdd(fresh)
    return { imported: fresh.length, skipped: parsed.records.length - fresh.length, invalid: parsed.invalid }
  })
}

export async function exportBackupJson(appVersion: string, database: WoordenboekDB = db): Promise<string> {
  return JSON.stringify(createBackup(await getAllVocabulary(database), appVersion), null, 2)
}

export function backupFileName(dateKey: string): string {
  return `mijn-woordenboek-backup-${dateKey}.json`
}
