import type { Vocabulary, VocabularyInput } from '@/types/vocabulary'
import { db, type WoordenboekDB } from '@/db/database'
import { isValidDateKey } from './dates'
import { validateVocabularyInput } from './validation'

/**
 * Words written as JSON files in src/words/<year>/<month>/<YYYY-MM-DD>.json.
 * Each file is an array of { dutch, chinese, exampleDutch, exampleChinese? }.
 * The date comes from the file name.
 */
export interface BundledWord extends VocabularyInput {
  id: string
}

export interface ParsedWordFiles {
  words: BundledWord[]
  errors: string[]
}

export function bundledWordId(date: string, dutch: string): string {
  return `file:${date}:${dutch.toLowerCase()}`
}

/** Parses the modules returned by import.meta.glob (path → JSON content). */
export function parseWordFiles(files: Record<string, unknown>): ParsedWordFiles {
  const words: BundledWord[] = []
  const errors: string[] = []
  const seen = new Set<string>()

  for (const [path, content] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const parts = path.split('/')
    const fileName = parts.pop() ?? path
    const date = fileName.replace(/\.json$/, '')
    if (!isValidDateKey(date)) {
      errors.push(`${fileName}: file name must be a date like 2026-10-30.json`)
      continue
    }
    const [year, month] = parts.slice(-2)
    if (year !== date.slice(0, 4) || month !== date.slice(5, 7)) {
      errors.push(`${fileName}: should be in the folder ${date.slice(0, 4)}/${date.slice(5, 7)}/`)
      continue
    }
    if (!Array.isArray(content)) {
      errors.push(`${fileName}: must contain a list of words: [ { ... }, { ... } ]`)
      continue
    }
    content.forEach((raw, i) => {
      const where = `${fileName} word ${i + 1}`
      if (typeof raw !== 'object' || raw === null) {
        errors.push(`${where}: must be an object`)
        return
      }
      const result = validateVocabularyInput({ ...(raw as Record<string, unknown>), date })
      if (!result.ok) {
        errors.push(`${where}: ${Object.values(result.errors).join(' ')}`)
        return
      }
      const id = bundledWordId(date, result.value.dutch)
      if (seen.has(id)) {
        errors.push(`${where}: "${result.value.dutch}" appears twice on ${date}`)
        return
      }
      seen.add(id)
      words.push({ ...result.value, id })
    })
  }
  return { words, errors }
}

const contentOf = ({ date, dutch, chinese, exampleDutch, exampleChinese }: BundledWord) =>
  JSON.stringify([date, dutch, chinese, exampleDutch, exampleChinese])

/**
 * Brings the database in line with the word files:
 * - new words in a file are added;
 * - words whose file content changed are updated;
 * - words removed from the files are removed from the app.
 * Edits made in the app to a file word are kept until that word changes in its file.
 */
export async function syncBundledWords(
  words: BundledWord[],
  database: WoordenboekDB = db,
  now = new Date(),
): Promise<{ added: number; updated: number; removed: number }> {
  return database.transaction('rw', database.vocabulary, database.bundled, async () => {
    const known = new Map((await database.bundled.toArray()).map((e) => [e.id, e.content]))
    let added = 0
    let updated = 0
    let removed = 0

    for (const [i, word] of words.entries()) {
      const content = contentOf(word)
      if (known.get(word.id) === content) continue

      const { id, ...fields } = word
      const timestamp = new Date(now.getTime() + i).toISOString() // keeps file order within a day
      const existing = await database.vocabulary.get(id)
      if (existing) {
        await database.vocabulary.update(id, { ...fields, updatedAt: timestamp })
        updated++
      } else {
        const item: Vocabulary = { ...fields, id, createdAt: timestamp, updatedAt: timestamp }
        await database.vocabulary.add(item)
        added++
      }
      await database.bundled.put({ id, content })
    }

    const current = new Set(words.map((w) => w.id))
    for (const id of known.keys()) {
      if (current.has(id)) continue
      await database.vocabulary.delete(id)
      await database.bundled.delete(id)
      removed++
    }
    return { added, updated, removed }
  })
}

export function loadWordFiles(): ParsedWordFiles {
  const modules = import.meta.glob<unknown>('../words/**/*.json', { eager: true, import: 'default' })
  return parseWordFiles(modules)
}

export async function syncWordFiles(): Promise<void> {
  const { words, errors } = loadWordFiles()
  for (const error of errors) console.warn(`[words] ${error}`)
  await syncBundledWords(words)
}
