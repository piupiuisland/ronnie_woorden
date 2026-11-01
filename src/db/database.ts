import Dexie, { type EntityTable } from 'dexie'
import type { Vocabulary, VocabularyInput } from '@/types/vocabulary'
import { createId } from '@/lib/id'

/** Remembers which words came from the JSON files in src/words, and their last-seen content. */
export interface BundledEntry {
  id: string
  content: string
}

export class WoordenboekDB extends Dexie {
  vocabulary!: EntityTable<Vocabulary, 'id'>
  bundled!: EntityTable<BundledEntry, 'id'>

  constructor(name = 'mijn-woordenboek') {
    super(name)
    // Schema history — never edit a published version; add a new one instead.
    this.version(1).stores({
      vocabulary: 'id, date, createdAt',
    })
    this.version(2).stores({
      bundled: 'id',
    })
  }
}

export const db = new WoordenboekDB()

/** Stable ordering used everywhere: by date, then by creation time. */
export function sortVocabulary(items: Vocabulary[]): Vocabulary[] {
  return [...items].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt),
  )
}

export async function addVocabulary(input: VocabularyInput, database: WoordenboekDB = db): Promise<Vocabulary> {
  const now = new Date().toISOString()
  const item: Vocabulary = { ...input, id: createId(), createdAt: now, updatedAt: now }
  await database.vocabulary.add(item)
  return item
}

export async function updateVocabulary(
  id: string,
  input: VocabularyInput,
  database: WoordenboekDB = db,
): Promise<void> {
  const updated = await database.vocabulary.update(id, { ...input, updatedAt: new Date().toISOString() })
  if (updated === 0) throw new Error('This word no longer exists.')
}

export async function deleteVocabulary(id: string, database: WoordenboekDB = db): Promise<void> {
  await database.vocabulary.delete(id)
}

export async function getWordsForDate(date: string, database: WoordenboekDB = db): Promise<Vocabulary[]> {
  return database.vocabulary.where('date').equals(date).sortBy('createdAt')
}

export async function getAllVocabulary(database: WoordenboekDB = db): Promise<Vocabulary[]> {
  return sortVocabulary(await database.vocabulary.toArray())
}

export async function getDatesWithWords(database: WoordenboekDB = db): Promise<string[]> {
  return (await database.vocabulary.orderBy('date').uniqueKeys()) as string[]
}

/** Ask the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted?.()) return true
      return await navigator.storage.persist()
    }
  } catch {
    // Not supported — ignore.
  }
  return false
}
